#!/bin/bash

# Setup MinIO bucket and policies

echo "Setting up MinIO..."

# Wait for MinIO to be ready
echo "Waiting for MinIO to be ready..."
sleep 5

# Configure mc (MinIO Client)
docker exec people-finder-dev-minio mc alias set myminio http://localhost:9000 minioadmin minioadmin

# Create bucket if it doesn't exist
docker exec people-finder-dev-minio mc mb myminio/people-finder --ignore-existing

# Set bucket policy to allow public read for presigned URLs
docker exec people-finder-dev-minio mc anonymous set download myminio/people-finder

echo "MinIO setup complete!"