#!/bin/bash

set -e

echo "🚀 Building People Finder Docker containers..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found. Please copy .env.example to .env and configure it."
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check required environment variables
required_vars=("NEXTAUTH_SECRET" "AZURE_AD_CLIENT_ID" "AZURE_AD_CLIENT_SECRET" "AZURE_AD_TENANT_ID")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: $var is not set in .env file"
        exit 1
    fi
done

echo "✅ Environment variables validated"

# Build with BuildKit for better performance
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

echo "🔨 Building Docker images..."
docker-compose build --no-cache

echo "🗄️  Starting database and MinIO..."
docker-compose up -d postgres minio

echo "⏳ Waiting for services to be ready..."
sleep 10

echo "🚀 Starting application..."
docker-compose up -d app

echo "📊 Running database migrations..."
sleep 5
docker-compose exec app npx prisma migrate deploy || echo "⚠️  Migration failed - database might already be up to date"

echo "✅ Build complete!"
echo ""
echo "🌐 Application: http://localhost:3010"
echo "📦 MinIO Console: http://localhost:9011 (minioadmin/minioadmin)"
echo "🗄️  PostgreSQL: localhost:5433 (postgres/postgres)"
echo ""
echo "📝 To view logs: docker-compose logs -f app"
echo "🛑 To stop: docker-compose down"