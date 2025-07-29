const { Client } = require('@opensearch-project/opensearch')

async function setupIndices() {
  const client = new Client({
    node: process.env.OPENSEARCH_URL || 'http://opensearch:9200'
  })

  const indices = {
    employees: 'people_finder_employees',
    documents: 'people_finder_documents'
  }

  // Create employees index
  try {
    await client.indices.create({
      index: indices.employees,
      body: {
        settings: {
          number_of_shards: 1,
          number_of_replicas: 0
        },
        mappings: {
          properties: {
            id: { type: 'keyword' },
            name: { 
              type: 'text',
              fields: {
                keyword: { type: 'keyword' }
              }
            },
            email: { type: 'keyword' },
            department: { 
              type: 'text',
              fields: {
                keyword: { type: 'keyword' }
              }
            },
            role: { 
              type: 'text',
              fields: {
                keyword: { type: 'keyword' }
              }
            },
            contract_type: {
              type: 'text',
              fields: {
                keyword: { type: 'keyword' }
              }
            },
            skills: { type: 'text' },
            bio: { type: 'text' }
          }
        }
      }
    })
    console.log('✅ Created employees index')
  } catch (error) {
    if (error.meta?.body?.error?.type === 'resource_already_exists_exception') {
      console.log('ℹ️  Employees index already exists')
    } else {
      console.error('Error creating employees index:', error)
    }
  }

  // Create documents index
  try {
    await client.indices.create({
      index: indices.documents,
      body: {
        settings: {
          number_of_shards: 1,
          number_of_replicas: 0,
          analysis: {
            analyzer: {
              multilingual: {
                type: 'standard',
                stopwords: '_none_'
              }
            }
          }
        },
        mappings: {
          properties: {
            id: { type: 'keyword' },
            employeeId: { type: 'keyword' },
            employeeName: { 
              type: 'text',
              fields: {
                keyword: { type: 'keyword' }
              }
            },
            fileName: { type: 'text' },
            fileType: { type: 'keyword' },
            content: { 
              type: 'text',
              analyzer: 'multilingual'
            },
            extractedText: { 
              type: 'text',
              analyzer: 'multilingual'
            },
            language: { type: 'keyword' },
            ocrProcessed: { type: 'boolean' },
            processedAt: { type: 'date' },
            uploadedAt: { type: 'date' },
            fileSize: { type: 'long' }
          }
        }
      }
    })
    console.log('✅ Created documents index')
  } catch (error) {
    if (error.meta?.body?.error?.type === 'resource_already_exists_exception') {
      console.log('ℹ️  Documents index already exists')
    } else {
      console.error('Error creating documents index:', error)
    }
  }

  console.log('\nIndices setup complete!')
  process.exit(0)
}

setupIndices().catch(console.error)