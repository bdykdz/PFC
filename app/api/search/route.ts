import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { Client } from '@opensearch-project/opensearch'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const from = parseInt(searchParams.get('from') || '0')
    const size = parseInt(searchParams.get('size') || '20')
    const department = searchParams.get('department')
    const contractType = searchParams.get('contractType')

    // Search API called

    if (!query.trim()) {
      return NextResponse.json({
        query: '',
        total: 0,
        results: [],
        facets: { departments: [], contractTypes: [] }
      })
    }

    // Build filters
    const filters: Record<string, any> = {}
    if (department) filters['department.keyword'] = department
    if (contractType) filters['contract_type.keyword'] = contractType

    // Initialize OpenSearch client
    const opensearchClient = new Client({
      node: process.env.OPENSEARCH_URL || 'http://localhost:9200',
    })
    
    const INDICES = {
      employees: `${process.env.OPENSEARCH_INDEX_PREFIX}_employees`,
      documents: `${process.env.OPENSEARCH_INDEX_PREFIX}_documents`,
    }

    // Build the search query
    const searchQuery = {
      bool: {
        should: [
          {
            multi_match: {
              query,
              fields: [
                'name^3',
                'department^1.5',
                'role^1.5',
                'skills',
                'bio'
              ],
              type: 'best_fields',
              fuzziness: 'AUTO'
            }
          }
        ],
        filter: Object.entries(filters).map(([field, value]) => ({
          term: { [field]: value }
        }))
      }
    }

    let results = {
      employees: { total: 0, hits: [] },
      documents: { total: 0, hits: [] }
    }

    try {
      // Search employees
      const employeesResponse = await opensearchClient.search({
        index: INDICES.employees,
        body: {
          query: searchQuery,
          from,
          size,
          highlight: {
            fields: {
              '*': {}
            },
            pre_tags: ['<mark>'],
            post_tags: ['</mark>']
          }
        }
      })

      // Search documents - use wildcard for partial matching
      const documentsQuery = {
        bool: {
          should: [
            {
              multi_match: {
                query,
                fields: [
                  'content^2',
                  'extractedText',
                  'fileName',
                  'employeeName'
                ],
                type: 'phrase_prefix',
                max_expansions: 50
              }
            },
            {
              wildcard: {
                content: {
                  value: `*${query.toLowerCase()}*`,
                  boost: 1.5
                }
              }
            },
            {
              wildcard: {
                extractedText: {
                  value: `*${query.toLowerCase()}*`,
                  boost: 1.5
                }
              }
            }
          ]
        }
      }

      // Searching documents index
      
      const documentsResponse = await opensearchClient.search({
        index: INDICES.documents,
        body: {
          query: documentsQuery,
          from,
          size,
          highlight: {
            fields: {
              'content*': {
                fragment_size: 150,
                number_of_fragments: 3
              },
              'extractedText': {
                fragment_size: 150,
                number_of_fragments: 3
              }
            },
            pre_tags: ['<mark>'],
            post_tags: ['</mark>']
          }
        }
      })

      // Documents search complete
      
      results = {
        employees: {
          total: employeesResponse.body.hits.total.value,
          hits: employeesResponse.body.hits.hits.map((hit: any) => ({
            ...hit._source,
            _score: hit._score,
            _highlights: hit.highlight
          }))
        },
        documents: {
          total: documentsResponse.body.hits.total.value,
          hits: documentsResponse.body.hits.hits.map((hit: any) => ({
            ...hit._source,
            _score: hit._score,
            _highlights: hit.highlight
          }))
        }
      }
    } catch (error) {
      // OpenSearch query error - Return empty results if OpenSearch fails
    }

    // Group documents by employee
    const employeeDocuments = new Map<string, any[]>()
    
    for (const doc of results.documents.hits) {
      if (!employeeDocuments.has(doc.employeeId)) {
        employeeDocuments.set(doc.employeeId, [])
      }
      employeeDocuments.get(doc.employeeId)!.push({
        id: doc.id,
        fileName: doc.fileName,
        highlights: doc._highlights?.content || doc._highlights?.extractedText || [],
        score: doc._score
      })
    }

    // Combine employee results with their matching documents
    const combinedResults = results.employees.hits.map(employee => ({
      ...employee,
      matchingDocuments: employeeDocuments.get(employee.id) || [],
      type: 'employee'
    }))

    // Add employees who only have document matches (not in employee search results)
    for (const [employeeId, docs] of employeeDocuments) {
      if (!combinedResults.find(e => e.id === employeeId)) {
        // Find employee info from first document
        const firstDoc = results.documents.hits.find(d => d.employeeId === employeeId)
        if (firstDoc) {
          combinedResults.push({
            id: employeeId,
            name: firstDoc.employeeName,
            matchingDocuments: docs,
            type: 'document-only',
            _score: Math.max(...docs.map(d => d.score))
          })
        }
      }
    }

    // Sort by relevance score
    combinedResults.sort((a, b) => (b._score || 0) - (a._score || 0))

    return NextResponse.json({
      query,
      total: combinedResults.length,
      results: combinedResults,
      facets: {
        departments: [], // You can implement faceted search later
        contractTypes: []
      }
    })
  } catch (error) {
    // Search error
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}