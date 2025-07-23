#!/bin/bash

# People Finder Deployment Script
# Usage: ./deploy.sh [environment]
# Environments: production, staging

set -e

ENVIRONMENT=${1:-production}
APP_NAME="people-finder"
COMPOSE_FILE="docker-compose.prod.yml"

echo "🚀 Deploying People Finder to $ENVIRONMENT environment..."

# Check if docker and docker-compose are installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating required directories..."
mkdir -p secrets nginx/certs logs

# Check if secrets exist
echo "🔐 Checking secrets..."
SECRETS=("db_user.txt" "db_password.txt" "minio_access_key.txt" "minio_secret_key.txt")
for secret in "${SECRETS[@]}"; do
    if [ ! -f "secrets/$secret" ]; then
        echo "❌ Secret file secrets/$secret not found!"
        echo "Please create all required secret files first."
        exit 1
    fi
done

# Check if SSL certificates exist
if [ ! -f "nginx/certs/fullchain.pem" ] || [ ! -f "nginx/certs/privkey.pem" ]; then
    echo "⚠️  SSL certificates not found. Creating self-signed certificates for testing..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/certs/privkey.pem \
        -out nginx/certs/fullchain.pem \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
    echo "⚠️  Self-signed certificates created. Please replace with real certificates for production!"
fi

# Check if .env file exists
if [ ! -f ".env.production" ]; then
    echo "❌ .env.production file not found!"
    echo "Please create .env.production with all required environment variables."
    exit 1
fi

# Pull latest images
echo "📥 Pulling latest Docker images..."
docker-compose -f $COMPOSE_FILE pull

# Build the application
echo "🏗️  Building application..."
docker-compose -f $COMPOSE_FILE build --no-cache

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f $COMPOSE_FILE down

# Start services
echo "▶️  Starting services..."
docker-compose -f $COMPOSE_FILE up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 30

# Check health
echo "🔍 Checking service health..."
if docker-compose -f $COMPOSE_FILE ps | grep -q "Up (healthy)"; then
    echo "✅ Services are healthy!"
else
    echo "❌ Some services are not healthy. Check logs:"
    docker-compose -f $COMPOSE_FILE logs
    exit 1
fi

# Run database migrations (if needed)
echo "🗄️  Running database migrations..."
docker-compose -f $COMPOSE_FILE exec app npx prisma migrate deploy || echo "⚠️  Migration failed or no migrations to run"

# Show final status
echo "📊 Final status:"
docker-compose -f $COMPOSE_FILE ps

echo ""
echo "🎉 Deployment completed successfully!"
echo "📱 Application should be available at your domain"
echo "📋 To view logs: docker-compose -f $COMPOSE_FILE logs -f"
echo "🛑 To stop: docker-compose -f $COMPOSE_FILE down"