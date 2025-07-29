import fs from 'fs/promises'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'
import { lookup } from 'mime-types'
// Remove static import of opensearch
import { prisma } from './prisma'
import { logger } from './logger'

const execAsync = promisify(exec)

// Supported file types
const SUPPORTED_TYPES = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'doc',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/tiff': 'tiff',
  'text/plain': 'txt'
}

// Language codes mapping for Tesseract
const TESSERACT_LANGS = {
  'ro': 'ron',  // Romanian
  'en': 'eng',  // English
  'pt': 'por',  // Portuguese
  'fr': 'fra',  // French
  'de': 'deu',  // German
  'hi': 'hin'   // Hindi
}

export interface ProcessedDocument {
  text: string
  language?: string
  ocrProcessed: boolean
  confidence?: number
}

// Extract text from PDF
async function extractFromPDF(filePath: string): Promise<string> {
  try {
    const dataBuffer = await fs.readFile(filePath)
    const data = await pdfParse(dataBuffer)
    return data.text || ''
  } catch (error) {
    logger.error('PDF extraction error:', error)
    return ''
  }
}

// Extract text from Word documents
async function extractFromWord(filePath: string): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ path: filePath })
    return result.value || ''
  } catch (error) {
    logger.error('Word extraction error:', error)
    return ''
  }
}

// Extract text from plain text files
async function extractFromText(filePath: string): Promise<string> {
  try {
    const text = await fs.readFile(filePath, 'utf-8')
    return text
  } catch (error) {
    logger.error('Text extraction error:', error)
    return ''
  }
}

// OCR processing using Tesseract
async function performOCR(filePath: string, languages: string[] = ['ron', 'eng']): Promise<string> {
  try {
    const langString = languages.join('+')
    const { stdout } = await execAsync(`tesseract "${filePath}" stdout -l ${langString}`)
    return stdout
  } catch (error) {
    logger.error('OCR error:', error)
    return ''
  }
}

// Detect language using a simple heuristic (you can replace with a proper language detection library)
function detectLanguage(text: string): string {
  const languagePatterns = {
    ro: /\b(și|sau|este|sunt|pentru|care|doar|după|când)\b/gi,
    en: /\b(the|and|is|are|for|that|with|have|this)\b/gi,
    pt: /\b(e|ou|é|são|para|que|com|tem|este)\b/gi,
    fr: /\b(et|ou|est|sont|pour|que|avec|avoir|ce)\b/gi,
    de: /\b(und|oder|ist|sind|für|dass|mit|haben|dies)\b/gi
  }

  const scores: Record<string, number> = {}
  
  for (const [lang, pattern] of Object.entries(languagePatterns)) {
    const matches = text.match(pattern)
    scores[lang] = matches ? matches.length : 0
  }

  // Return the language with the highest score, default to 'en'
  const detectedLang = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || 'en'
  
  return detectedLang
}

// Check if text needs OCR (if too short or mostly non-text)
function needsOCR(text: string): boolean {
  // If text is too short, probably needs OCR
  if (text.trim().length < 100) return true
  
  // Check if text has too many special characters (might be garbled)
  const alphanumericRatio = (text.match(/[a-zA-Z0-9\s]/g) || []).length / text.length
  if (alphanumericRatio < 0.7) return true
  
  return false
}

// Main document processing function
export async function processDocument(
  filePath: string,
  fileType: string,
  documentId: string,
  employeeId: string
): Promise<ProcessedDocument> {
  let extractedText = ''
  let ocrProcessed = false
  
  try {
    // Extract text based on file type
    switch (fileType) {
      case 'application/pdf':
        extractedText = await extractFromPDF(filePath)
        break
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        extractedText = await extractFromWord(filePath)
        break
      case 'text/plain':
        extractedText = await extractFromText(filePath)
        break
    }

    // Check if we need OCR
    if (needsOCR(extractedText) || extractedText.trim().length === 0) {
      logger.log(`Performing OCR on ${path.basename(filePath)}...`)
      const ocrText = await performOCR(filePath)
      if (ocrText.trim().length > extractedText.trim().length) {
        extractedText = ocrText
        ocrProcessed = true
      }
    }

    // Detect language
    const detectedLanguage = detectLanguage(extractedText)

    // Update document in database
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        extracted_text: extractedText,
        ocr_processed: ocrProcessed,
        language: detectedLanguage,
        processed_at: new Date()
      },
      include: {
        employee: true
      }
    })

    // For now, skip OpenSearch indexing to avoid module resolution issues
    // TODO: Implement OpenSearch indexing via a separate background job or service
    logger.log('Document processed successfully. OpenSearch indexing temporarily disabled.')

    return {
      text: extractedText,
      language: detectedLanguage,
      ocrProcessed
    }
  } catch (error) {
    logger.error('Document processing error:', error)
    throw error
  }
}

// Process all unprocessed documents (for batch processing)
export async function processUnprocessedDocuments() {
  try {
    const unprocessedDocs = await prisma.document.findMany({
      where: {
        processed_at: null
      },
      include: {
        employee: true
      }
    })

    logger.log(`Found ${unprocessedDocs.length} unprocessed documents`)

    for (const doc of unprocessedDocs) {
      try {
        logger.log(`Processing ${doc.name}...`)
        
        // Get the file type from the stored metadata or file extension
        const mimeType = doc.file_type || lookup(doc.name) || 'application/octet-stream'
        
        // Note: You'll need to download the file from MinIO first
        // This is a placeholder - implement the MinIO download logic
        const localFilePath = await downloadFromMinIO(doc.file_url)
        
        await processDocument(localFilePath, mimeType, doc.id, doc.employee_id)
        
        // Clean up temporary file
        await fs.unlink(localFilePath)
      } catch (error) {
        logger.error(`Error processing document ${doc.id}:`, error)
      }
    }
  } catch (error) {
    logger.error('Batch processing error:', error)
    throw error
  }
}

// Placeholder for MinIO download - you'll need to implement this
async function downloadFromMinIO(fileUrl: string): Promise<string> {
  // Implementation needed: Download file from MinIO to temporary location
  // Return the temporary file path
  throw new Error('MinIO download not implemented yet')
}