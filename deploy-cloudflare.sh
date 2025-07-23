#!/bin/bash

# People Finder Deployment Script for Cloudflare Tunnels
# Usage: ./deploy-cloudflare.sh

set -e

APP_NAME="people-finder"
COMPOSE_FILE="docker-compose.cloudflare.yml"

echo "🚀 Deploying People Finder with Cloudflare Tunnels..."

# Check if required files exist
if [ ! -f ".env.cloudflare" ]; then
    echo "❌ .env.cloudflare file not found!"
    echo "Please create .env.cloudflare with all required environment variables."
    exit 1
fi

# Load environment variables
export $(cat .env.cloudflare | grep -v '#' | xargs)

# Stop existing containers (if any)
echo "🛑 Stopping existing containers..."
docker-compose -f $COMPOSE_FILE down 2>/dev/null || true

# Remove old images to ensure fresh build
echo "🧹 Cleaning up old images..."
docker rmi people-finder-app:latest 2>/dev/null || true

# Build the application
echo "🏗️  Building application..."
docker-compose -f $COMPOSE_FILE build --no-cache

# Start services
echo "▶️  Starting services..."
docker-compose -f $COMPOSE_FILE up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 30

# Check health
echo "🔍 Checking service health..."
for i in {1..12}; do
    if curl -f http://localhost:3020/api/health >/dev/null 2>&1; then
        echo "✅ Application is healthy!"
        break
    fi
    if [ $i -eq 12 ]; then
        echo "❌ Application failed to start properly. Check logs:"
        docker-compose -f $COMPOSE_FILE logs --tail=50
        exit 1
    fi
    echo "⏳ Waiting... ($i/12)"
    sleep 10
done

# Run database migrations
echo "🗄️  Running database migrations..."
docker-compose -f $COMPOSE_FILE exec app npx prisma migrate deploy || echo "⚠️  Migration failed or no migrations to run"

# Show final status
echo "📊 Final status:"
docker-compose -f $COMPOSE_FILE ps

echo ""
echo "🎉 Deployment completed successfully!"
echo "📱 Application is running on port 3020"
echo "🌐 Configure your Cloudflare Tunnel to point to localhost:3020"
echo ""
echo "📋 Next steps:"
echo "1. Add tunnel configuration in Cloudflare Zero Trust dashboard"
echo "2. Point your domain to localhost:3020 via the tunnel"
echo "3. Access your app at https://your-domain.com"
echo ""
echo "🔧 Management commands:"
echo "📋 View logs: docker-compose -f $COMPOSE_FILE logs -f"
echo "🛑 Stop: docker-compose -f $COMPOSE_FILE down"
echo "🔄 Restart: docker-compose -f $COMPOSE_FILE restart"