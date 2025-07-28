#!/bin/bash
set -e

# Update App Script - Updates only the application without touching the database
# This script preserves all data in PostgreSQL and MinIO

echo "🚀 People Finder - App Update Script"
echo "===================================="
echo "This will update the application without affecting your data."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    print_error "Error: docker-compose.yml not found!"
    echo "Please run this script from the People Finder root directory."
    exit 1
fi

# Detect which docker-compose file is being used
if [ -f ".active-compose" ]; then
    COMPOSE_FILE=$(cat .active-compose)
    print_status "Using compose file: $COMPOSE_FILE"
else
    # Try to detect based on running containers
    if docker ps | grep -q "cloudflare"; then
        COMPOSE_FILE="docker-compose.cloudflare.yml"
    elif docker ps | grep -q "nginx"; then
        COMPOSE_FILE="docker-compose.prod.yml"
    else
        print_warning "Could not detect deployment type. Please specify:"
        echo "1) docker-compose.cloudflare.yml (Cloudflare Tunnel)"
        echo "2) docker-compose.prod.yml (Direct with Nginx)"
        echo "3) docker-compose.existing-server.yml (Existing proxy)"
        read -p "Enter choice (1-3): " choice
        case $choice in
            1) COMPOSE_FILE="docker-compose.cloudflare.yml";;
            2) COMPOSE_FILE="docker-compose.prod.yml";;
            3) COMPOSE_FILE="docker-compose.existing-server.yml";;
            *) print_error "Invalid choice"; exit 1;;
        esac
    fi
fi

# Save the active compose file for future updates
echo "$COMPOSE_FILE" > .active-compose

print_status "Starting app update process..."

# Step 1: Pull latest code
print_status "Pulling latest code from git..."
git pull origin main || {
    print_error "Failed to pull latest code. Please commit or stash your changes."
    exit 1
}

# Step 2: Backup current environment
if [ -f ".env.production" ]; then
    print_status "Backing up environment file..."
    cp .env.production .env.production.backup-$(date +%Y%m%d-%H%M%S)
fi

# Step 3: Stop only the app container (keep DB and MinIO running)
print_status "Stopping application container..."
docker-compose -f "$COMPOSE_FILE" stop app || true

# Step 4: Remove old app container and image
print_status "Removing old application container..."
docker-compose -f "$COMPOSE_FILE" rm -f app || true

# Remove old image to force rebuild
docker rmi people-finder-app:latest 2>/dev/null || true

# Step 5: Rebuild the app container
print_status "Building new application image..."
docker-compose -f "$COMPOSE_FILE" build app || {
    print_error "Build failed! Attempting to restore..."
    docker-compose -f "$COMPOSE_FILE" up -d app
    exit 1
}

# Step 6: Start the updated app
print_status "Starting updated application..."
docker-compose -f "$COMPOSE_FILE" up -d app

# Step 7: Wait for app to be healthy
print_status "Waiting for application to be healthy..."
attempts=0
max_attempts=30
while [ $attempts -lt $max_attempts ]; do
    if docker-compose -f "$COMPOSE_FILE" ps app | grep -q "healthy"; then
        print_status "Application is healthy!"
        break
    fi
    echo -n "."
    sleep 2
    attempts=$((attempts + 1))
done

if [ $attempts -eq $max_attempts ]; then
    print_warning "Application health check timed out. Checking logs..."
    docker-compose -f "$COMPOSE_FILE" logs --tail=50 app
fi

# Step 8: Show status
echo ""
echo "===================================="
print_status "Update completed!"
echo ""
echo "Container Status:"
docker-compose -f "$COMPOSE_FILE" ps

echo ""
echo "Application Logs (last 20 lines):"
docker-compose -f "$COMPOSE_FILE" logs --tail=20 app

echo ""
print_status "Your data in PostgreSQL and MinIO has been preserved."
print_status "Only the application code has been updated."

# Optional: Run any post-update tasks
if [ -f "scripts/post-update.sh" ]; then
    print_status "Running post-update tasks..."
    bash scripts/post-update.sh
fi

echo ""
echo "🎉 Update complete! Your app is now running the latest version."