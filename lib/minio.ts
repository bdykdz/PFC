import { Client } from 'minio'

// Parse the MinIO endpoint to extract hostname
const getMinioConfig = () => {
  const endpoint = process.env.MINIO_ENDPOINT || 'http://minio:9000'
  let hostname = 'minio'
  let port = 9000
  let useSSL = false

  try {
    const url = new URL(endpoint)
    hostname = url.hostname
    port = parseInt(url.port) || (url.protocol === 'https:' ? 443 : 9000)
    useSSL = url.protocol === 'https:'
  } catch (e) {
    // If parsing fails, use the endpoint as hostname
    hostname = endpoint.replace(/^https?:\/\//, '').split(':')[0]
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