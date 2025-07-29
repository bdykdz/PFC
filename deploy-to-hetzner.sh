#!/bin/bash

# People Finder - Automated Deployment Script for Hetzner
# This script automates the deployment process to your Hetzner server

set -e  # Exit on error

# Configuration
SERVER_IP="${1:-}"
SERVER_USER="${2:-root}"
APP_DIR="/opt/people-finder"
LOCAL_DIR="$(pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if server IP is provided
if [ -z "$SERVER_IP" ]; then
    print_error "Usage: $0 <server-ip> [username]"
    exit 1
fi

print_status "Starting deployment to $SERVER_IP"

# Step 1: Check SSH connection
print_status "Testing SSH connection..."
if ! ssh -o ConnectTimeout=5 "${SERVER_USER}@${SERVER_IP}" "echo 'SSH connection successful'"; then
    print_error "Cannot connect to server. Please check your SSH access."
    exit 1
fi

# Step 2: Create remote directory
print_status "Creating application directory on server..."
ssh "${SERVER_USER}@${SERVER_IP}" "mkdir -p ${APP_DIR}"

# Step 3: Sync files to server
print_status "Syncing files to server..."
rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude '.git' \
    --exclude '*.log' \
    --exclude 'postgres_data' \
    --exclude 'minio_data' \
    --exclude 'opensearch_data' \
    --exclude '.env.local' \
    --exclude '.env.development' \
    --exclude 'hetzner-key.txt' \
    "${LOCAL_DIR}/" "${SERVER_USER}@${SERVER_IP}:${APP_DIR}/"

# Step 4: Check if .env.production exists
print_status "Checking for production environment file..."
if ! ssh "${SERVER_USER}@${SERVER_IP}" "test -f ${APP_DIR}/.env.production"; then
    print_warning ".env.production not found on server!"
    print_status "Creating template .env.production file..."
    
    # Create a template .env.production
    ssh "${SERVER_USER}@${SERVER_IP}" "cat > ${APP_DIR}/.env.production" << 'EOF'
# Application
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=CHANGE_THIS_TO_A_RANDOM_STRING

# Database
DATABASE_URL=postgresql://postgres:CHANGE_THIS_PASSWORD@postgres:5432/peoplefinder?schema=public
POSTGRES_USER=postgres
POSTGRES_PASSWORD=CHANGE_THIS_PASSWORD
POSTGRES_DB=peoplefinder

# MinIO (S3-compatible storage)
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=CHANGE_THIS_ACCESS_KEY
MINIO_SECRET_KEY=CHANGE_THIS_SECRET_KEY
MINIO_BUCKET_NAME=people-finder
MINIO_USE_SSL=false
MINIO_ROOT_USER=CHANGE_THIS_ACCESS_KEY
MINIO_ROOT_PASSWORD=CHANGE_THIS_SECRET_KEY

# OpenSearch
OPENSEARCH_URL=http://opensearch:9200
OPENSEARCH_INDEX_PREFIX=people_finder

# Azure AD (optional)
AZURE_AD_CLIENT_ID=
AZURE_AD_CLIENT_SECRET=
AZURE_AD_TENANT_ID=

# Email (optional)
EMAIL_FROM=noreply@your-domain.com
EMAIL_SERVER_HOST=
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=
EMAIL_SERVER_PASSWORD=
EOF
    
    print_error "IMPORTANT: Edit ${APP_DIR}/.env.production on the server before continuing!"
    print_error "Run: ssh ${SERVER_USER}@${SERVER_IP} nano ${APP_DIR}/.env.production"
    read -p "Press Enter after you've updated the .env.production file..."
fi

# Step 5: Copy production docker-compose
print_status "Setting up Docker Compose configuration..."
ssh "${SERVER_USER}@${SERVER_IP}" "cd ${APP_DIR} && cp docker-compose.production.yml docker-compose.yml"

# Step 6: Create production Dockerfile
print_status "Creating production Dockerfile..."
ssh "${SERVER_USER}@${SERVER_IP}" "cd ${APP_DIR} && cat > Dockerfile.prod" << 'EOF'
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies for canvas and other native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy application files
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production image
FROM node:20-alpine

# Install runtime dependencies including OCR tools
RUN apk add --no-cache \
    cairo \
    jpeg \
    pango \
    giflib \
    tesseract-ocr \
    tesseract-ocr-data-ron \
    tesseract-ocr-data-eng \
    tesseract-ocr-data-por \
    tesseract-ocr-data-fra \
    tesseract-ocr-data-deu \
    poppler-utils \
    wget \
    unzip

WORKDIR /app

# Copy built application
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/lib ./lib

# Copy other necessary files
COPY server.js ./
COPY next.config.mjs ./

EXPOSE 3000

CMD ["node", "server.js"]
EOF

# Step 7: Build Docker image
print_status "Building Docker image (this may take a few minutes)..."
ssh "${SERVER_USER}@${SERVER_IP}" "cd ${APP_DIR} && docker build -f Dockerfile.prod -t people-finder:latest ."

# Step 8: Stop existing containers (if any)
print_status "Stopping existing containers..."
ssh "${SERVER_USER}@${SERVER_IP}" "cd ${APP_DIR} && docker-compose down || true"

# Step 9: Start infrastructure services
print_status "Starting infrastructure services..."
ssh "${SERVER_USER}@${SERVER_IP}" "cd ${APP_DIR} && docker-compose up -d postgres minio opensearch"

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 30

# Step 10: Initialize database
print_status "Running database migrations..."
ssh "${SERVER_USER}@${SERVER_IP}" "cd ${APP_DIR} && docker-compose run --rm app npx prisma migrate deploy"

# Step 11: Initialize MinIO
print_status "Initializing MinIO storage..."
ssh "${SERVER_USER}@${SERVER_IP}" "cd ${APP_DIR} && docker-compose run --rm app node scripts/init-minio.js"

# Step 12: Initialize OpenSearch
print_status "Initializing OpenSearch indices..."
ssh "${SERVER_USER}@${SERVER_IP}" "cd ${APP_DIR} && docker-compose run --rm app node scripts/setup-opensearch-indices.js"

# Step 13: Check if admin user exists
print_status "Checking for admin user..."
ADMIN_EXISTS=$(ssh "${SERVER_USER}@${SERVER_IP}" "cd ${APP_DIR} && docker-compose run --rm app node -e \"
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findFirst({ where: { role: 'admin' } })
  .then(user => console.log(user ? 'exists' : 'none'))
  .finally(() => prisma.\$disconnect());
\"" 2>/dev/null | grep -E "exists|none" || echo "none")

if [[ "$ADMIN_EXISTS" == "none" ]]; then
    print_warning "No admin user found. Creating one..."
    ssh "${SERVER_USER}@${SERVER_IP}" "cd ${APP_DIR} && docker-compose run --rm app node scripts/create-admin.js"
fi

# Step 14: Start all services
print_status "Starting all services..."
ssh "${SERVER_USER}@${SERVER_IP}" "cd ${APP_DIR} && docker-compose up -d"

# Step 15: Check deployment
print_status "Checking deployment status..."
sleep 10

# Check if services are running
if ssh "${SERVER_USER}@${SERVER_IP}" "cd ${APP_DIR} && docker-compose ps | grep -E 'Up|running'" > /dev/null; then
    print_status "Services are running!"
    
    # Check health endpoint
    if ssh "${SERVER_USER}@${SERVER_IP}" "curl -s http://localhost:3000/api/health | grep -q 'ok'"; then
        print_status "Application health check passed!"
    else
        print_warning "Application health check failed. Check logs with:"
        print_warning "ssh ${SERVER_USER}@${SERVER_IP} 'cd ${APP_DIR} && docker-compose logs app'"
    fi
else
    print_error "Some services are not running. Check logs with:"
    print_error "ssh ${SERVER_USER}@${SERVER_IP} 'cd ${APP_DIR} && docker-compose logs'"
fi

# Step 16: Display access information
echo ""
print_status "Deployment complete!"
echo ""
echo "Access your application at:"
echo "  - http://${SERVER_IP}:3000"
echo ""
echo "Useful commands:"
echo "  - View logs: ssh ${SERVER_USER}@${SERVER_IP} 'cd ${APP_DIR} && docker-compose logs -f'"
echo "  - Restart app: ssh ${SERVER_USER}@${SERVER_IP} 'cd ${APP_DIR} && docker-compose restart app'"
echo "  - Stop all: ssh ${SERVER_USER}@${SERVER_IP} 'cd ${APP_DIR} && docker-compose down'"
echo ""
print_warning "Don't forget to:"
print_warning "1. Set up a domain name and configure NEXTAUTH_URL in .env.production"
print_warning "2. Set up HTTPS with Let's Encrypt (see DEPLOYMENT_GUIDE.md)"
print_warning "3. Configure firewall rules"
print_warning "4. Set up automated backups"