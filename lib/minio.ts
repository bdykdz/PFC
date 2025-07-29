import { Client } from 'minio'

// Parse the MinIO endpoint to extract hostname
const getMinioConfig = () => {
  // In Docker, use internal hostname; otherwise use environment variable
  const isDocker = process.env.NODE_ENV === 'development' && process.env.MINIO_ENDPOINT
  const endpoint = isDocker ? 'minio' : (process.env.MINIO_ENDPOINT || 'http://minio:9000')
  
  let hostname = 'minio'
  let port = 9000
  let useSSL = false

  if (!isDocker && endpoint.startsWith('http')) {
    try {
      const url = new URL(endpoint)
      hostname = url.hostname
      port = parseInt(url.port) || (url.protocol === 'https:' ? 443 : 9000)
      useSSL = url.protocol === 'https:'
    } catch (e) {
      // If parsing fails, use the endpoint as hostname
      hostname = endpoint.replace(/^https?:\/\//, '').split(':')[0]
    }
  } else {
    // For Docker internal communication
    hostname = 'minio'
    port = 9000
    useSSL = false
  }

  return { hostname, port, useSSL }
}

const config = getMinioConfig()

export const minioClient = new Client({
  endPoint: config.hostname,
  port: config.port,
  useSSL: config.useSSL,
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
})

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'people-finder'

// Ensure bucket exists
export async function ensureBucket() {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME)
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1')
      console.log(`Bucket ${BUCKET_NAME} created successfully`)
    }
  } catch (error) {
    console.error('Error ensuring bucket exists:', error)
    throw error
  }
}

// Upload file to MinIO
export async function uploadToMinio(file: File, path: string): Promise<string> {
  try {
    await ensureBucket()
    
    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = `${path}/${Date.now()}-${file.name}`
    
    await minioClient.putObject(
      BUCKET_NAME,
      fileName,
      buffer,
      buffer.length,
      {
        'Content-Type': file.type,
      }
    )
    
    return fileName
  } catch (error) {
    console.error('Error uploading to MinIO:', error)
    throw error
  }
}

// Upload buffer to MinIO (for document processing)
export async function uploadBufferToMinio(buffer: Buffer, fileName: string, contentType: string): Promise<string> {
  try {
    await ensureBucket()
    
    await minioClient.putObject(
      BUCKET_NAME,
      fileName,
      buffer,
      buffer.length,
      {
        'Content-Type': contentType,
      }
    )
    
    return fileName
  } catch (error) {
    console.error('Error uploading buffer to MinIO:', error)
    throw error
  }
}

// Delete file from MinIO
export async function deleteFromMinio(filePath: string): Promise<void> {
  try {
    await minioClient.removeObject(BUCKET_NAME, filePath)
  } catch (error) {
    console.error('Error deleting from MinIO:', error)
    // Don't throw error if file doesn't exist
  }
}

// Get presigned URL for file download
export async function getPresignedUrl(filePath: string): Promise<string> {
  try {
    await ensureBucket()
    
    // Check if file exists
    try {
      await minioClient.statObject(BUCKET_NAME, filePath)
    } catch (error) {
      console.error('File not found in MinIO:', filePath)
      throw new Error('File not found')
    }
    
    const url = await minioClient.presignedGetObject(BUCKET_NAME, filePath, 24 * 60 * 60) // 24 hours
    
    // If we're in Docker development, replace the internal minio hostname with localhost
    if (process.env.NODE_ENV === 'development') {
      // Replace minio:9000 with localhost:9010 for external access
      return url.replace(/http:\/\/minio:9000/g, 'http://localhost:9010')
    }
    
    return url
  } catch (error) {
    console.error('Error getting presigned URL:', error)
    throw error
  }
}

// Get direct download URL (for production with proper domain)
export async function getDownloadUrl(filePath: string): Promise<string> {
  // In production, you would configure this with your actual domain
  const publicEndpoint = process.env.MINIO_PUBLIC_ENDPOINT || process.env.MINIO_ENDPOINT || 'http://localhost:9010'
  return `${publicEndpoint}/${BUCKET_NAME}/${filePath}`
}