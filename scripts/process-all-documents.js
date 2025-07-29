// Simple script to trigger processing of all unprocessed documents
const http = require('http')

async function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    }

    const req = http.request(options, (res) => {
      let responseData = ''
      
      res.on('data', (chunk) => {
        responseData += chunk
      })
      
      res.on('end', () => {
        try {
          resolve(JSON.parse(responseData))
        } catch (e) {
          resolve(responseData)
        }
      })
    })
    
    req.on('error', reject)
    
    if (data) {
      req.write(JSON.stringify(data))
    }
    
    req.end()
  })
}

async function processAllDocuments() {
  try {
    // Get unprocessed documents
    console.log('Fetching unprocessed documents...')
    const response = await makeRequest('/api/documents/process')
    
    if (!response.documents || response.documents.length === 0) {
      console.log('No unprocessed documents found!')
      return
    }
    
    console.log(`Found ${response.documents.length} unprocessed documents`)
    
    // Process each document
    for (const doc of response.documents) {
      console.log(`Processing: ${doc.name} (ID: ${doc.id})`)
      
      try {
        await makeRequest('/api/documents/process', 'POST', { documentId: doc.id })
        console.log(`  ✅ Queued for processing`)
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`)
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    console.log('\\nAll documents queued for processing!')
    console.log('Check the application logs for processing status.')
  } catch (error) {
    console.error('Error:', error)
  }
}

processAllDocuments()