const { PrismaClient } = require('@prisma/client')
const { Client } = require('@opensearch-project/opensearch')
const { exec } = require('child_process')
const { promisify } = require('util')
const fs = require('fs').promises
const path = require('path')
const os = require('os')
const logger = require('./logger')

const prisma = new PrismaClient()
const execAsync = promisify(exec)

const opensearchClient = new Client({
  node: process.env.OPENSEARCH_URL || 'http://opensearch:9200',
})

async function getFileFromMinio(fileUrl) {
  const tempFile = path.join(os.tmpdir(), `download-${Date.now()}`)
  const pathParts = fileUrl.replace('people-finder/', '').split('/')
  const encodedPath = pathParts.map(part => encodeURIComponent(part)).join('/')
  const minioUrl = `http://minio:9000/people-finder/${encodedPath}`
  
  await execAsync(`wget -q -O "${tempFile}" "${minioUrl}"`)
  return tempFile
}

async function processDocument(document) {
  logger.log(`Processing: ${document.name} (ID: ${document.id})`)
  
  try {
    const tempFilePath = await getFileFromMinio(document.file_url)
    
    let extractedText = ''
    let ocrProcessed = false
    
    // Try to extract text based on file type
    if (document.file_type === 'application/pdf') {
      // First, do a quick check with pdftotext to see if it's a text-based PDF
      try {
        const { stdout } = await execAsync(`pdftotext "${tempFilePath}" - | head -c 500`)
        extractedText = stdout.trim()
        
        if (extractedText.length > 50) {
          // Seems like a text-based PDF, extract all text
          const { stdout: fullText } = await execAsync(`pdftotext "${tempFilePath}" -`)
          extractedText = fullText.trim()
          logger.log(`  Extracted ${extractedText.length} chars using pdftotext (text-based PDF)`)
        } else {
          logger.log(`  PDF appears to be scanned (only ${extractedText.length} chars found), will use OCR`)
          extractedText = '' // Reset for OCR
        }
      } catch (error) {
        logger.log('  pdftotext failed, will use OCR')
        extractedText = ''
      }
    } else if (
      document.file_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      document.file_type === 'application/msword'
    ) {
      // Extract text from Word documents
      logger.log('  Processing Word document...')
      try {
        // First, let's check if we have the necessary tools
        try {
          // Try using unzip and xml parsing for DOCX
          const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'docx-'))
          await execAsync(`unzip -q "${tempFilePath}" -d "${tempDir}"`)
          
          // Read the main document content
          const documentXmlPath = path.join(tempDir, 'word/document.xml')
          const xmlContent = await fs.readFile(documentXmlPath, 'utf-8')
          
          // Extract text from XML (basic extraction)
          const textMatches = xmlContent.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || []
          extractedText = textMatches
            .map(match => match.replace(/<[^>]+>/g, ''))
            .join(' ')
            .trim()
          
          await fs.rm(tempDir, { recursive: true })
          logger.log(`  Extracted ${extractedText.length} chars from DOCX`)
        } catch (unzipError) {
          logger.log('  Unzip method failed, trying alternative...')
          // Fallback: use strings command to extract any readable text
          const { stdout } = await execAsync(`strings "${tempFilePath}" | grep -E "^.{5,}" | head -5000`)
          extractedText = stdout.trim()
          logger.log(`  Extracted ${extractedText.length} chars using strings command`)
        }
      } catch (error) {
        logger.log('  Word document extraction failed:', error.message)
        extractedText = ''
      }
    } else if (document.file_type?.startsWith('text/')) {
      // Plain text files
      logger.log('  Processing text file...')
      try {
        extractedText = await fs.readFile(tempFilePath, 'utf-8')
        logger.log(`  Read ${extractedText.length} chars from text file`)
      } catch (error) {
        logger.log('  Text file reading failed:', error.message)
        extractedText = ''
      }
    }
    
    // If no text or too short, use OCR (likely scanned document)
    if (extractedText.length < 100) {
      logger.log('  Running OCR on scanned document...')
      
      if (document.file_type === 'application/pdf') {
        // Convert PDF to images first
        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ocr-'))
        await execAsync(`pdftoppm -png "${tempFilePath}" "${tempDir}/page"`)
        
        // OCR each page
        const files = await fs.readdir(tempDir)
        const pageTexts = []
        
        for (const file of files.sort()) {
          if (file.endsWith('.png')) {
            logger.log(`    Processing page: ${file}`)
            const { stdout } = await execAsync(`tesseract "${path.join(tempDir, file)}" stdout -l ron+eng`)
            pageTexts.push(stdout)
          }
        }
        
        extractedText = pageTexts.join('\\n\\n--- Page Break ---\\n\\n')
        await fs.rm(tempDir, { recursive: true })
      } else if (document.file_type?.startsWith('image/')) {
        const { stdout } = await execAsync(`tesseract "${tempFilePath}" stdout -l ron+eng`)
        extractedText = stdout
      }
      
      ocrProcessed = true
      logger.log(`  OCR extracted ${extractedText.length} chars`)
    }
    
    // Detect language
    const roMatches = (extractedText.match(/\\b(și|sau|este|sunt|pentru|care|doar|după|când)\\b/gi) || []).length
    const enMatches = (extractedText.match(/\\b(the|and|is|are|for|that|with|have|this)\\b/gi) || []).length
    const detectedLanguage = roMatches > enMatches ? 'ro' : 'en'
    logger.log(`  Detected language: ${detectedLanguage}`)
    
    // Update document in database
    await prisma.document.update({
      where: { id: document.id },
      data: {
        extracted_text: extractedText,
        ocr_processed: ocrProcessed,
        language: detectedLanguage,
        processed_at: new Date()
      }
    })
    logger.log(`  ✅ Updated database`)
    
    // Index in OpenSearch
    await opensearchClient.index({
      index: 'people_finder_documents',
      id: document.id,
      body: {
        id: document.id,
        employeeId: document.employee_id,
        employeeName: document.employee.name,
        fileName: document.name,
        fileType: document.file_type,
        content: extractedText,
        extractedText: extractedText,
        language: detectedLanguage,
        ocrProcessed: ocrProcessed,
        processedAt: new Date(),
        uploadedAt: document.uploaded_at,
        fileSize: document.file_size || 0
      },
      refresh: true
    })
    logger.log(`  ✅ Indexed in OpenSearch`)
    
    // Cleanup
    await fs.unlink(tempFilePath)
    
    logger.log(`  ✅ Successfully processed!`)
    return true
  } catch (error) {
    logger.error(`  ❌ Error: ${error.message}`)
    return false
  }
}

async function processUnprocessedDocuments() {
  try {
    // Get all unprocessed documents
    const documents = await prisma.document.findMany({
      where: {
        processed_at: null
      },
      include: {
        employee: true
      }
    })
    
    if (documents.length > 0) {
      logger.log(`Found ${documents.length} unprocessed documents`)
      
      // Process each document
      for (const doc of documents) {
        await processDocument(doc)
      }
    }
    
    return documents.length
  } catch (error) {
    logger.error('Error fetching documents:', error)
    return 0
  }
}

async function main() {
  logger.log('Document processor worker started...')
  
  // Run immediately on start
  await processUnprocessedDocuments()
  
  // Then run every 30 seconds
  setInterval(async () => {
    const processed = await processUnprocessedDocuments()
    if (processed > 0) {
      logger.log(`\\n[${new Date().toISOString()}] Processed ${processed} documents`)
    }
  }, 30000)
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.log('Shutting down worker...')
  await prisma.$disconnect()
  process.exit(0)
})

main()