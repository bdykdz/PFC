const { PrismaClient } = require('@prisma/client')
const { Client } = require('@opensearch-project/opensearch')

const prisma = new PrismaClient()
const opensearchClient = new Client({
  node: process.env.OPENSEARCH_URL || 'http://opensearch:9200'
})

async function reindexDocuments() {
  try {
    // Get all processed documents
    const documents = await prisma.document.findMany({
      where: {
        processed_at: { not: null }
      },
      include: {
        employee: true
      }
    })

    console.log(`Found ${documents.length} processed documents to reindex`)

    for (const doc of documents) {
      if (!doc.extracted_text) {
        console.log(`Skipping ${doc.name} - no extracted text`)
        continue
      }

      try {
        await opensearchClient.index({
          index: 'people_finder_documents',
          id: doc.id,
          body: {
            id: doc.id,
            employeeId: doc.employee_id,
            employeeName: doc.employee.name,
            fileName: doc.name,
            fileType: doc.file_type,
            content: doc.extracted_text,
            extractedText: doc.extracted_text,
            language: doc.language,
            ocrProcessed: doc.ocr_processed,
            processedAt: doc.processed_at,
            uploadedAt: doc.uploaded_at,
            fileSize: doc.file_size || 0
          },
          refresh: true
        })
        console.log(`✅ Reindexed: ${doc.name}`)
      } catch (error) {
        console.error(`❌ Error reindexing ${doc.name}:`, error.message)
      }
    }

    console.log('\nReindexing complete!')
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

reindexDocuments()