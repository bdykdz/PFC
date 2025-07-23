#!/bin/bash

# This script runs Prisma migrations in the Docker container

echo "Running Prisma migrations..."

# Wait for the database to be ready
echo "Waiting for database to be ready..."
sleep 5

# Run migrations
docker-compose exec app npx prisma migrate deploy

# Generate Prisma client
docker-compose exec app npx prisma generate

echo "Migrations completed successfully!"