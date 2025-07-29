import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { Client } from '@opensearch-project/opensearch'
import { getPresignedUrl } from '@/lib/minio'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

export const runtime = 'nodejs'
export const maxDuration = 60 // 60 seconds for OCR processing

const execAsync = promisify(exec)

// Process a specific document
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { documentId } = await request.json()

    // Get document from database
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { employee: true }
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Get file URL from MinIO
    const fileUrl = await getPresignedUrl(document.file_url)

    // Download file to temp directory
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'doc-'))
    const tempFilePath = path.join(tempDir, document.name)

    // Download file
    const response = await fetch(fileUrl)
    const buffer = await response.arrayBuffer()
    await fs.writeFile(tempFilePath, Buffer.from(buffer))

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
          console.log(`Extracted ${extractedText.length} chars using pdftotext (text-based PDF)`)
        } else {
          console.log(`PDF appears to be scanned (only ${extractedText.length} chars found), will use OCR`)
          extractedText = '' // Reset for OCR
        }
      } catch (error) {
        console.log('pdftotext failed, will use OCR')
        extractedText = ''
      }
    } else if (
      document.file_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      document.file_type === 'application/msword'
    ) {
      // Extract text from Word documents using mammoth
      try {
        const mammoth = await import('mammoth')
        const result = await mammoth.extractRawText({ path: tempFilePath })
        extractedText = result.value || ''
      } catch (error) {
        console.log('Word extraction failed:', error)
      }
    } else if (document.file_type?.startsWith('image/')) {
      // For images, go directly to OCR
      console.log('Image file detected, will use OCR')
    }

    // If no text extracted or too short, use OCR (likely scanned document)
    if (extractedText.trim().length < 100) {
      console.log('Running OCR on scanned document...')
      try {
        // For PDFs, convert to images first then OCR
        if (document.file_type === 'application/pdf') {
          // Convert PDF to images
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
          
          extractedText = pageTexts.join('\n\n')
        } else if (document.file_type?.startsWith('image/')) {
          // Direct OCR for images (JPEG, PNG, TIFF, etc.)
          const { stdout } = await execAsync(`tesseract "${tempFilePath}" stdout -l ron+eng`)
          extractedText = stdout
        }
        ocrProcessed = true
      } catch (error) {
        console.error('OCR error:', error)
      }
    }

    // Detect language
    const languagePatterns = {
      ro: /\b(și|sau|este|sunt|pentru|care|doar|după|când)\b/gi,
      en: /\b(the|and|is|are|for|that|with|have|this)\b/gi,
    }

    let detectedLanguage = 'en'
    let maxMatches = 0

    for (const [lang, pattern] of Object.entries(languagePatterns)) {
      const matches = extractedText.match(pattern)
      if (matches && matches.length > maxMatches) {
        maxMatches = matches.length
        detectedLanguage = lang
      }
    }

    // Update document in database
    await prisma.document.update({
      where: { id: documentId },
      data: {
        extracted_text: extractedText,
        ocr_processed: ocrProcessed,
        language: detectedLanguage,
        processed_at: new Date()
      }
    })

    // Index in OpenSearch
    const opensearchClient = new Client({
      node: process.env.OPENSEARCH_URL || 'http://localhost:9200',
    })

    await opensearchClient.index({
      index: `${process.env.OPENSEARCH_INDEX_PREFIX}_documents`,
      id: documentId,
      body: {
        id: documentId,
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

    // Cleanup temp files
    await fs.rm(tempDir, { recursive: true, force: true })

    return NextResponse.json({
      success: true,
      document: {
        id: documentId,
        extractedText: extractedText.substring(0, 200) + '...',
        language: detectedLanguage,
        ocrProcessed
      }
    })
  } catch (error) {
    console.error('Document processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process document' },
      { status: 500 }
    )
  }
}

// Get all unprocessed documents
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const unprocessedDocs = await prisma.document.findMany({
      where: {
        processed_at: null
      },
      select: {
        id: true,
        name: true,
        file_type: true,
        uploaded_at: true,
        employee: {
          select: {
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      documents: unprocessedDocs,
      count: unprocessedDocs.length
    })
  } catch (error) {
    console.error('Error fetching unprocessed documents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}