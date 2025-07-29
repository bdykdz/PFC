#!/bin/bash
set -e

# CLEAN DEPLOYMENT SCRIPT
# This ensures a fresh deployment from GitHub

echo "🚀 CLEAN DEPLOYMENT SCRIPT"
echo "========================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Get compose file
if [ -f ".active-compose" ]; then
    COMPOSE_FILE=$(cat .active-compose)
else
    COMPOSE_FILE="docker-compose.cloudflare.yml"
fi

# Step 1: Stop application
print_status "Stopping application..."
docker-compose -f "$COMPOSE_FILE" stop app || true

# Step 2: Clean git - remove any local changes
print_status "Cleaning local changes..."
git reset --hard HEAD
git clean -fd

# Step 3: Pull latest from GitHub
print_status "Pulling latest code from GitHub..."
git pull origin main

# Step 4: Remove old container
print_status "Removing old container..."
docker-compose -f "$COMPOSE_FILE" rm -f app || true

# Step 5: Build fresh
print_status "Building application..."
if docker-compose -f "$COMPOSE_FILE" build app --no-cache; then
    print_status "Build successful!"
else
    print_error "Build failed!"
    exit 1
fi

# Step 6: Apply database migrations
print_status "Applying database migrations..."
docker-compose -f "$COMPOSE_FILE" run --rm app npx prisma db push || true
docker-compose -f "$COMPOSE_FILE" run --rm app npx prisma generate

# Step 7: Start application
print_status "Starting application..."
docker-compose -f "$COMPOSE_FILE" up -d app

# Wait a bit
sleep 10

# Step 8: Check status
echo ""
echo "================================"
print_status "Deployment complete!"
echo ""
docker-compose -f "$COMPOSE_FILE" ps
echo ""
echo "Your application has been deployed with the latest code from GitHub!"