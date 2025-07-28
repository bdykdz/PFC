import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getPresignedUrl } from '@/lib/minio'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const filePath = searchParams.get('path')

    if (!filePath) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 })
    }

    console.log('Downloading file:', filePath)
    console.log('MinIO config:', {
      endpoint: process.env.MINIO_ENDPOINT,
      accessKey: process.env.MINIO_ACCESS_KEY ? 'set' : 'not set',
      bucket: process.env.MINIO_BUCKET_NAME
    })

    // Generate presigned URL for download
    const presignedUrl = await getPresignedUrl(filePath)
    console.log('Generated presigned URL:', presignedUrl)

    // Redirect to the presigned URL
    return NextResponse.redirect(presignedUrl)
  } catch (error) {
    console.error('Error generating download URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate download URL' },
      { status: 500 }
    )
  }
}