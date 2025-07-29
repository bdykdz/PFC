import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { minioClient } from '@/lib/minio'

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'people-finder'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    // Reconstruct the file path from the segments
    const filePath = resolvedParams.path.join('/')
    console.log('Direct download requested for:', filePath)

    // Get the file from MinIO
    const stream = await minioClient.getObject(BUCKET_NAME, filePath)
    const chunks: Buffer[] = []
    
    // Collect all chunks
    for await (const chunk of stream) {
      chunks.push(chunk)
    }
    
    const buffer = Buffer.concat(chunks)
    
    // Determine content type
    const contentType = filePath.endsWith('.pdf') ? 'application/pdf' : 
                       filePath.endsWith('.jpg') || filePath.endsWith('.jpeg') ? 'image/jpeg' :
                       filePath.endsWith('.png') ? 'image/png' :
                       'application/octet-stream'
    
    // Return the file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filePath.split('/').pop()}"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error downloading file:', error)
    return NextResponse.json(
      { error: 'File not found or access denied' },
      { status: 404 }
    )
  }
}