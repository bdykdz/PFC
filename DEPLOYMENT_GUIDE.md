# People Finder - Production Deployment Guide

This guide will walk you through deploying the People Finder application to your Hetzner server.

## Prerequisites

- SSH access to your Hetzner server
- Docker and Docker Compose installed on the server
- Domain name pointed to your server (optional but recommended)
- SSL certificates (optional, for HTTPS)

## Step 1: Prepare the Server

SSH into your server:
```bash
ssh root@your-server-ip
```

Create application directory:
```bash
mkdir -p /opt/people-finder
cd /opt/people-finder
```

## Step 2: Transfer Files

From your local machine, copy the necessary files:
```bash
# Run this from your local machine (not on the server)
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.git' \
  --exclude 'postgres_data' --exclude 'minio_data' --exclude 'opensearch_data' \
  ./ root@your-server-ip:/opt/people-finder/
```

## Step 3: Create Production Environment File

On the server, create `.env.production`:
```bash
cd /opt/people-finder
nano .env.production
```

Add the following (adjust values as needed):
```env
# Application
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-very-secure-random-string-here

# Database
DATABASE_URL=postgresql://postgres:your-secure-password@postgres:5432/peoplefinder?schema=public
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DB=peoplefinder

# MinIO (S3-compatible storage)
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=your-minio-access-key
MINIO_SECRET_KEY=your-minio-secret-key
MINIO_BUCKET_NAME=people-finder
MINIO_USE_SSL=false
MINIO_ROOT_USER=your-minio-access-key
MINIO_ROOT_PASSWORD=your-minio-secret-key

# OpenSearch
OPENSEARCH_URL=http://opensearch:9200
OPENSEARCH_INDEX_PREFIX=people_finder

# Azure AD (if using)
AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret
AZURE_AD_TENANT_ID=your-tenant-id

# Email (optional)
EMAIL_FROM=noreply@your-domain.com
EMAIL_SERVER_HOST=smtp.your-email-provider.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@example.com
EMAIL_SERVER_PASSWORD=your-email-password
```

## Step 4: Build the Application

Create production Dockerfile if not exists:
```bash
nano Dockerfile.prod
```

```dockerfile
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
```

Build the Docker image:
```bash
docker build -f Dockerfile.prod -t people-finder:latest .
```

## Step 5: Initialize Services

Start the infrastructure services first:
```bash
# Use the production compose file
cp docker-compose.production.yml docker-compose.yml

# Start database, storage, and search services
docker-compose up -d postgres minio opensearch

# Wait for services to be ready (about 30 seconds)
sleep 30
```

## Step 6: Initialize Database and Storage

Run database migrations:
```bash
docker-compose run --rm app npx prisma migrate deploy
```

Initialize MinIO bucket:
```bash
docker-compose run --rm app node scripts/init-minio.js
```

Initialize OpenSearch indices:
```bash
docker-compose run --rm app node scripts/setup-opensearch-indices.js
```

## Step 7: Create Admin User

```bash
docker-compose run --rm app node scripts/create-admin.js
```

## Step 8: Start All Services

```bash
# Start all services including the document processor
docker-compose up -d

# Check logs
docker-compose logs -f app
```

## Step 9: Configure Nginx (Optional - for HTTPS)

If you want to use HTTPS with a domain:

```bash
# Install Nginx and Certbot
apt update
apt install nginx certbot python3-certbot-nginx -y

# Create Nginx configuration
nano /etc/nginx/sites-available/people-finder
```

Add:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site and get SSL certificate:
```bash
ln -s /etc/nginx/sites-available/people-finder /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# Get SSL certificate
certbot --nginx -d your-domain.com
```

## Step 10: Verify Deployment

1. Check all services are running:
```bash
docker-compose ps
```

2. Check application health:
```bash
curl http://localhost:3000/api/health
```

3. Access the application:
   - HTTP: http://your-server-ip:3000
   - HTTPS: https://your-domain.com (if configured)

## Maintenance Commands

### View logs:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f document-processor
```

### Restart services:
```bash
docker-compose restart app
docker-compose restart document-processor
```

### Update application:
```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose build
docker-compose up -d
```

### Backup database:
```bash
docker-compose exec postgres pg_dump -U postgres peoplefinder > backup-$(date +%Y%m%d).sql
```

### Process existing documents:
```bash
docker-compose exec app node scripts/process-all-documents.js
```

## Troubleshooting

### Check service health:
```bash
# Database
docker-compose exec postgres pg_isready

# MinIO
curl http://localhost:9000/minio/health/live

# OpenSearch
curl http://localhost:9200/_cluster/health
```

### Reset and restart:
```bash
docker-compose down
docker-compose up -d
```

### View document processor logs:
```bash
docker-compose logs -f document-processor
```

## Security Checklist

- [ ] Change all default passwords in .env.production
- [ ] Set strong NEXTAUTH_SECRET
- [ ] Configure firewall to only allow necessary ports
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Regularly update Docker images
- [ ] Set up automated backups
- [ ] Monitor disk space for uploads

## Notes

- The document processor runs automatically every 30 seconds
- Uploaded documents are processed for full-text search
- OCR is performed on scanned PDFs and images
- Logs are minimized in production (NODE_ENV=production)