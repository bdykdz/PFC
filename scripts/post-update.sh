#!/bin/bash

# Post-update script for People Finder
# This handles any database migrations or other tasks needed after code update

echo "📋 Running post-update tasks..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Get the compose file from parent script
if [ -f ".active-compose" ]; then
    COMPOSE_FILE=$(cat .active-compose)
else
    COMPOSE_FILE="docker-compose.yml"
fi

# 1. Apply database migrations
print_status "Applying database migrations..."
docker-compose -f "$COMPOSE_FILE" exec -T app npx prisma db push || {
    print_warning "Database migration failed. This might be normal if no schema changes were made."
}

# 2. Generate Prisma client
print_status "Regenerating Prisma client..."
docker-compose -f "$COMPOSE_FILE" exec -T app npx prisma generate

# 3. Clear any caches
print_status "Clearing application caches..."
docker-compose -f "$COMPOSE_FILE" exec -T app rm -rf .next/cache 2>/dev/null || true

# 4. Restart the app to ensure all changes are loaded
print_status "Restarting application with new changes..."
docker-compose -f "$COMPOSE_FILE" restart app

echo ""
print_status "Post-update tasks completed!"
echo ""
echo "📝 Changes in this update:"
echo "  - Added saved searches functionality (new database table)"
echo "  - Fixed authentication session handling"
echo "  - Fixed document upload/download with MinIO"
echo "  - Fixed various UI bugs and translations"
echo "  - Improved search filters"
echo ""
print_warning "Important: Users may need to log out and log back in for session updates."