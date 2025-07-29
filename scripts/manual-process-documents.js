const { PrismaClient } = require('@prisma/client')
const { Client } = require('@opensearch-project/opensearch')
const { exec } = require('child_process')
const { promisify } = require('util')
const fs = require('fs').promises
const path = require('path')
const os = require('os')

const prisma = new PrismaClient()
const execAsync = promisify(exec)

async function getFileFromMinio(fileUrl) {
  // Use wget to download from MinIO since it's available in Alpine
  const tempFile = path.join(os.tmpdir(), `download-${Date.now()}`)
  // URL encode the path after the bucket name
  const pathParts = fileUrl.replace('people-finder/', '').split('/')
  const encodedPath = pathParts.map(part => encodeURIComponent(part)).join('/')
  const minioUrl = `http://minio:9000/people-finder/${encodedPath}`
  
  await execAsync(`wget -q -O "${tempFile}" "${minioUrl}"`)
  return tempFile
}

async function processDocument(document) {
  console.log(`\\nProcessing: ${document.name} (ID: ${document.id})`)
  
  try {
    // Download file from MinIO
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
          console.log(`  Extracted ${extractedText.length} chars using pdftotext (text-based PDF)`)
        } else {
          console.log(`  PDF appears to be scanned (only ${extractedText.length} chars found), will use OCR`)
          extractedText = '' // Reset for OCR
        }
      } catch (error) {
        console.log('  pdftotext failed, will use OCR')
        extractedText = ''
      }
    }
    
    // If no text or too short, use OCR (likely scanned document)
    if (extractedText.length < 100) {
      console.log('  Running OCR on scanned document...')
      
      if (document.file_type === 'application/pdf') {
        // Convert PDF to images first
        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ocr-'))
        await execAsync(`pdftoppm -png "${tempFilePath}" "${tempDir}/page"`)
        
        // OCR each page
        const files = await fs.readdir(tempDir)
        const pageTexts = []
        
        for (const file of files.sort()) {
          if (file.endsWith('.png')) {
            console.log(`    Processing page: ${file}`)
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
      console.log(`  OCR extracted ${extractedText.length} chars`)
    }
    
    // Detect language
    const roMatches = (extractedText.match(/\\b(și|sau|este|sunt|pentru|care|doar|după|când)\\b/gi) || []).length
    const enMatches = (extractedText.match(/\\b(the|and|is|are|for|that|with|have|this)\\b/gi) || []).length
    const detectedLanguage = roMatches > enMatches ? 'ro' : 'en'
    console.log(`  Detected language: ${detectedLanguage}`)
    
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
    console.log(`  ✅ Updated database`)
    
    // Index in OpenSearch
    const opensearchClient = new Client({
      node: 'http://opensearch:9200',
    })
    
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
    console.log(`  ✅ Indexed in OpenSearch`)
    
    // Cleanup
    await fs.unlink(tempFilePath)
    
    console.log(`  ✅ Successfully processed!`)
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`)
  }
}

async function main() {
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
    
    console.log(`Found ${documents.length} unprocessed documents`)
    
    if (documents.length === 0) {
      console.log('No documents to process!')
      return
    }
    
    // Process each document
    for (const doc of documents) {
      await processDocument(doc)
    }
    
    console.log('\\n✅ All documents processed!')
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()