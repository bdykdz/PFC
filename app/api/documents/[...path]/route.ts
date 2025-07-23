import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { minioClient } from '@/lib/minio'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { path } = await params;
    const filePath = path.join('/')
    
    // Get the object from MinIO
    const stream = await minioClient.getObject('people-finder', filePath)
    
    // Get the object info to determine content type
    const stat = await minioClient.statObject('people-finder', filePath)
    
    // Convert stream to buffer
    const chunks: Buffer[] = []
    for await (const chunk of stream) {
      chunks.push(chunk)
    }
    const buffer = Buffer.concat(chunks)
    
    // Determine content type from file extension
    const extension = filePath.split('.').pop()?.toLowerCase()
    let contentType = 'application/octet-stream'
    
    switch (extension) {
      case 'pdf':
        contentType = 'application/pdf'
        break
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg'
        break
      case 'png':
        contentType = 'image/png'
        break
      case 'doc':
        contentType = 'application/msword'
        break
      case 'docx':
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        break
    }
    
    // Return the file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filePath.split('/').pop()}"`,
        'Content-Length': buffer.length.toString(),
      }
    })
    
  } catch (error) {
    console.error('Error fetching document:', error)
    return new NextResponse('Document not found', { status: 404 })
  }
}