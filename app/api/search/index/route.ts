import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { Client } from '@opensearch-project/opensearch'

export const runtime = 'nodejs'

// This endpoint indexes an employee in OpenSearch
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    
    const opensearchClient = new Client({
      node: process.env.OPENSEARCH_URL || 'http://localhost:9200',
    })
    
    const INDICES = {
      employees: `${process.env.OPENSEARCH_INDEX_PREFIX}_employees`,
      documents: `${process.env.OPENSEARCH_INDEX_PREFIX}_documents`,
    }

    if (data.type === 'employee') {
      await opensearchClient.index({
        index: INDICES.employees,
        id: data.id,
        body: {
          id: data.id,
          name: data.name,
          email: data.email,
          department: data.department,
          role: data.role,
          skills: data.skills || [],
          bio: data.bio,
          profileImage: data.profileImage,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        },
        refresh: true
      })
    } else if (data.type === 'document') {
      await opensearchClient.index({
        index: INDICES.documents,
        id: data.id,
        body: {
          id: data.id,
          employeeId: data.employeeId,
          employeeName: data.employeeName,
          fileName: data.fileName,
          fileType: data.fileType,
          content: data.content,
          extractedText: data.extractedText,
          language: data.language,
          ocrProcessed: data.ocrProcessed,
          processedAt: data.processedAt,
          uploadedAt: data.uploadedAt,
          fileSize: data.fileSize
        },
        refresh: true
      })
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Indexing error:', error)
    return NextResponse.json(
      { error: 'Failed to index data' },
      { status: 500 }
    )
  }
}