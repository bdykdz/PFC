#!/bin/bash
set -e

# Manual Update Script - For updating on the server without GitHub Actions
# Run this script on your production server

echo "🔄 People Finder - Manual Update"
echo "================================"
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

# Step 1: Navigate to app directory
APP_DIR="/opt/people-finder"  # Change this to your actual deployment directory
if [ -d "$APP_DIR" ]; then
    cd "$APP_DIR"
    print_status "Changed to app directory: $APP_DIR"
else
    print_error "App directory not found: $APP_DIR"
    echo "Please update APP_DIR in this script to match your deployment location."
    exit 1
fi

# Step 2: Detect compose file
if [ -f ".active-compose" ]; then
    COMPOSE_FILE=$(cat .active-compose)
else
    # Default to cloudflare if not specified
    COMPOSE_FILE="docker-compose.cloudflare.yml"
fi

print_status "Using compose file: $COMPOSE_FILE"

# Step 3: Pull latest changes
print_status "Pulling latest code..."
git pull origin main

# Step 4: Update only the app container
print_status "Updating application container..."
docker-compose -f "$COMPOSE_FILE" pull app 2>/dev/null || true
docker-compose -f "$COMPOSE_FILE" build app
docker-compose -f "$COMPOSE_FILE" up -d app

# Step 5: Check health
print_status "Checking application health..."
sleep 10
docker-compose -f "$COMPOSE_FILE" ps

echo ""
print_status "Update complete! Database and storage remain untouched."