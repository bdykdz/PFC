import { Client } from '@opensearch-project/opensearch'

const LANGUAGE_ANALYZERS = {
  romanian: {
    analyzer: {
      romanian_analyzer: {
        type: 'custom' as const,
        tokenizer: 'standard',
        filter: ['lowercase', 'romanian_stop', 'romanian_stemmer', 'asciifolding']
      }
    },
    filter: {
      romanian_stop: {
        type: 'stop' as const,
        stopwords: '_romanian_'
      },
      romanian_stemmer: {
        type: 'stemmer' as const,
        language: 'romanian'
      }
    }
  },
  english: {
    analyzer: {
      english_analyzer: {
        type: 'custom' as const,
        tokenizer: 'standard',
        filter: ['lowercase', 'english_stop', 'english_stemmer', 'asciifolding']
      }
    },
    filter: {
      english_stop: {
        type: 'stop' as const,
        stopwords: '_english_'
      },
      english_stemmer: {
        type: 'stemmer' as const,
        language: 'english'
      }
    }
  },
  multilingual: {
    analyzer: {
      multilingual_analyzer: {
        type: 'custom' as const,
        tokenizer: 'standard',
        filter: ['lowercase', 'asciifolding']
      }
    }
  }
}

async function main() {
  try {
    console.log('Initializing OpenSearch indices...')
    
    const opensearchClient = new Client({
      node: process.env.OPENSEARCH_URL || 'http://localhost:9200',
    })
    
    const INDICES = {
      employees: `${process.env.OPENSEARCH_INDEX_PREFIX}_employees`,
      documents: `${process.env.OPENSEARCH_INDEX_PREFIX}_documents`,
    }
    
    // Check if indices exist
    const employeesExists = await opensearchClient.indices.exists({
      index: INDICES.employees
    })

    const documentsExists = await opensearchClient.indices.exists({
      index: INDICES.documents
    })

    // Create employees index if it doesn't exist
    if (!employeesExists.body) {
      await opensearchClient.indices.create({
        index: INDICES.employees,
        body: {
          settings: {
            analysis: {
              analyzer: {
                ...LANGUAGE_ANALYZERS.romanian.analyzer,
                ...LANGUAGE_ANALYZERS.english.analyzer,
                ...LANGUAGE_ANALYZERS.multilingual.analyzer
              },
              filter: {
                ...LANGUAGE_ANALYZERS.romanian.filter,
                ...LANGUAGE_ANALYZERS.english.filter
              }
            }
          },
          mappings: {
            properties: {
              id: { type: 'keyword' },
              name: { 
                type: 'text',
                analyzer: 'standard',
                fields: {
                  keyword: { type: 'keyword' },
                  romanian: { type: 'text', analyzer: 'romanian_analyzer' },
                  english: { type: 'text', analyzer: 'english_analyzer' }
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
              skills: { 
                type: 'text',
                analyzer: 'multilingual_analyzer'
              },
              bio: { 
                type: 'text',
                analyzer: 'multilingual_analyzer'
              },
              profileImage: { type: 'keyword' },
              createdAt: { type: 'date' },
              updatedAt: { type: 'date' }
            }
          }
        }
      })
      console.log('Created employees index')
    }

    // Create documents index if it doesn't exist
    if (!documentsExists.body) {
      await opensearchClient.indices.create({
        index: INDICES.documents,
        body: {
          settings: {
            analysis: {
              analyzer: {
                ...LANGUAGE_ANALYZERS.romanian.analyzer,
                ...LANGUAGE_ANALYZERS.english.analyzer,
                ...LANGUAGE_ANALYZERS.multilingual.analyzer
              },
              filter: {
                ...LANGUAGE_ANALYZERS.romanian.filter,
                ...LANGUAGE_ANALYZERS.english.filter
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
              fileName: { 
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' }
                }
              },
              fileType: { type: 'keyword' },
              content: { 
                type: 'text',
                analyzer: 'multilingual_analyzer',
                fields: {
                  romanian: { type: 'text', analyzer: 'romanian_analyzer' },
                  english: { type: 'text', analyzer: 'english_analyzer' }
                }
              },
              extractedText: { 
                type: 'text',
                analyzer: 'multilingual_analyzer'
              },
              language: { type: 'keyword' },
              ocrProcessed: { type: 'boolean' },
              processedAt: { type: 'date' },
              uploadedAt: { type: 'date' },
              fileSize: { type: 'long' },
              metadata: { type: 'object' }
            }
          }
        }
      })
      console.log('Created documents index')
    }

    console.log('OpenSearch initialization complete!')
    process.exit(0)
  } catch (error) {
    console.error('Failed to initialize OpenSearch:', error)
    process.exit(1)
  }
}

main()