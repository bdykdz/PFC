const { S3Client, CreateBucketCommand, HeadBucketCommand } = require('@aws-sdk/client-s3')

const client = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
  },
  forcePathStyle: true,
})

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'people-finder'

async function initBucket() {
  try {
    // Check if bucket exists
    await client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }))
    console.log(`Bucket ${BUCKET_NAME} already exists`)
  } catch (error) {
    if (error.$metadata?.httpStatusCode === 404) {
      // Create bucket if it doesn't exist
      try {
        await client.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }))
        console.log(`Bucket ${BUCKET_NAME} created successfully`)
      } catch (createError) {
        console.error('Error creating bucket:', createError)
      }
    } else {
      console.error('Error checking bucket:', error)
    }
  }
}

initBucket()