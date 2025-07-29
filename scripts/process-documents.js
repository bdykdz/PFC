const { PrismaClient } = require('@prisma/client')
const { Client } = require('@opensearch-project/opensearch')
const fs = require('fs/promises')
const path = require('path')
const { exec } = require('child_process')
const { promisify } = require('util')
const https = require('https')
const http = require('http')

const prisma = new PrismaClient()
const execAsync = promisify(exec)

const opensearchClient = new Client({
  node: process.env.OPENSEARCH_URL || 'http://opensearch:9200',
})

async function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http
    const file = require('fs').createWriteStream(filePath)
    
    protocol.get(url, (response) => {
      response.pipe(file)
      file.on('finish', () => {
        file.close()
        resolve()
      })
    }).on('error', (err) => {
      fs.unlink(filePath).catch(() => {})
      reject(err)
    })
  })
}

async function processDocument(document) {
  console.log(`Processing document: ${document.id} - ${document.name}`)
  
  try {
    // Create temp directory
    const tempDir = await fs.mkdtemp(path.join('/tmp', 'doc-'))
    const tempFilePath = path.join(tempDir, document.name)
    
    // Download file from MinIO
    const minioUrl = `http://minio:9000/people-finder/${document.file_url.replace('people-finder/', '')}`
    await downloadFile(minioUrl, tempFilePath)
    
    let extractedText = ''
    let ocrProcessed = false
    
    // Extract text based on file type
    if (document.file_type === 'application/pdf') {
      try {
        const { stdout } = await execAsync(`pdftotext "${tempFilePath}" -`)
        extractedText = stdout
      } catch (error) {
        console.log('pdftotext failed, trying OCR...')
      }
    }
    
    // If no text or too short, use OCR
    if (extractedText.trim().length < 100) {
      console.log('Running OCR...')
      
      if (document.file_type === 'application/pdf') {
        // Convert PDF to images first
        const imagesDir = path.join(tempDir, 'images')
        await fs.mkdir(imagesDir)
        await execAsync(`pdftoppm -png "${tempFilePath}" "${imagesDir}/page"`)
        
        // OCR each page
        const files = await fs.readdir(imagesDir)
        const pageTexts = []
        
        for (const file of files.sort()) {
          if (file.endsWith('.png')) {
            const { stdout } = await execAsync(`tesseract "${path.join(imagesDir, file)}" stdout -l ron+eng`)
            pageTexts.push(stdout)
          }
        }
        
        extractedText = pageTexts.join('\\n\\n')
      } else if (document.file_type?.startsWith('image/')) {
        const { stdout } = await execAsync(`tesseract "${tempFilePath}" stdout -l ron+eng`)
        extractedText = stdout
      }
      
      ocrProcessed = true
    }
    
    // Detect language
    const roMatches = (extractedText.match(/\\b(și|sau|este|sunt|pentru|care|doar|după|când)\\b/gi) || []).length
    const enMatches = (extractedText.match(/\\b(the|and|is|are|for|that|with|have|this)\\b/gi) || []).length
    const detectedLanguage = roMatches > enMatches ? 'ro' : 'en'
    
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
    
    // Cleanup
    await fs.rm(tempDir, { recursive: true, force: true })
    
    console.log(`✅ Successfully processed: ${document.name} (${extractedText.length} chars extracted)`)
  } catch (error) {
    console.error(`❌ Error processing ${document.name}:`, error)
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
    
    // Process documents one by one
    for (const doc of documents) {
      await processDocument(doc)
      // Small delay between documents
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    console.log('\\n✅ All documents processed!')
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()