# People Finder - Complete Setup Guide

## Table of Contents
1. [System Requirements](#system-requirements)
2. [Azure AD Setup](#azure-ad-setup)
3. [Local Development Setup](#local-development-setup)
4. [Production Deployment](#production-deployment)
5. [Post-Installation Configuration](#post-installation-configuration)
6. [Troubleshooting](#troubleshooting)

## System Requirements

### Hardware Requirements
- **Minimum**: 4GB RAM, 2 CPU cores, 10GB disk space
- **Recommended**: 8GB RAM, 4 CPU cores, 20GB disk space

### Software Prerequisites
- **Docker**: Version 20.10.0 or higher
- **Docker Compose**: Version 2.0.0 or higher
- **Node.js**: Version 20.0.0 or higher (for local development)
- **npm**: Version 9.0.0 or higher
- **Git**: Version 2.0.0 or higher

### Operating System
- Linux (Ubuntu 20.04+, CentOS 8+, Debian 10+)
- macOS 11.0+
- Windows 10/11 with WSL2

## Azure AD Setup

### Step 1: Create Azure AD App Registration

1. **Login to Azure Portal**
   - Navigate to https://portal.azure.com
   - Sign in with your organizational account

2. **Navigate to App Registrations**
   - Go to Azure Active Directory → App registrations
   - Click "New registration"

3. **Configure Basic Settings**
   - Name: `People Finder App`
   - Supported account types: `Accounts in this organizational directory only`
   - Redirect URI:
     - Type: `Web`
     - URL: `http://localhost:3010/api/auth/callback/azure-ad`

4. **Note Required Values**
   - Application (client) ID: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - Directory (tenant) ID: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### Step 2: Configure Authentication

1. **Add Platform Configuration**
   - Go to Authentication → Add a platform → Web
   - Redirect URIs:
     ```
     http://localhost:3010/api/auth/callback/azure-ad
     https://your-domain.com/api/auth/callback/azure-ad
     ```
   - Front-channel logout URL: `http://localhost:3010/api/auth/signout`
   - Enable "ID tokens" and "Access tokens"

2. **Configure Token Settings**
   - Implicit grant: Enable ID tokens
   - Supported account types: Single tenant

### Step 3: Create Client Secret

1. **Generate Secret**
   - Go to Certificates & secrets → Client secrets → New client secret
   - Description: `People Finder Secret`
   - Expires: Choose appropriate expiration
   - Copy the secret value immediately (it won't be shown again)

### Step 4: Configure API Permissions

1. **Add Required Permissions**
   - Go to API permissions → Add a permission
   - Microsoft Graph → Delegated permissions:
     ```
     - User.Read
     - User.ReadBasic.All
     - Directory.Read.All
     - GroupMember.Read.All
     - email
     - openid
     - profile
     ```

2. **Grant Admin Consent**
   - Click "Grant admin consent for [Your Organization]"
   - Confirm the action

## Local Development Setup

### Step 1: Clone Repository

```bash
# Clone the repository
git clone [repository-url]
cd People-Finder-Containerized

# Verify files
ls -la
```

### Step 2: Environment Configuration

1. **Copy Environment Template**
   ```bash
   cp .env.example .env
   ```

2. **Generate Secrets**
   ```bash
   # Generate NEXTAUTH_SECRET
   openssl rand -base64 32
   
   # Generate CSRF_SECRET
   openssl rand -base64 32
   
   # Generate ENCRYPTION_KEY (must be exactly 32 characters)
   openssl rand -hex 16
   ```

3. **Edit .env File**
   ```bash
   nano .env  # or use your preferred editor
   ```

   Update these values:
   ```env
   # Database
   DATABASE_URL="postgresql://postgres:postgres@localhost:5433/peoplefinder?sslmode=require"
   
   # NextAuth
   NEXTAUTH_URL="http://localhost:3010"
   NEXTAUTH_SECRET="[Your generated NEXTAUTH_SECRET]"
   
   # Microsoft Azure AD
   AZURE_AD_CLIENT_ID="[Your Azure AD Client ID]"
   AZURE_AD_CLIENT_SECRET="[Your Azure AD Client Secret]"
   AZURE_AD_TENANT_ID="[Your Azure AD Tenant ID]"
   
   # MinIO Storage
   MINIO_ENDPOINT="http://localhost:9010"
   MINIO_ACCESS_KEY="minioadmin"
   MINIO_SECRET_KEY="minioadmin"
   MINIO_BUCKET_NAME="people-finder"
   
   # Security
   CSRF_SECRET="[Your generated CSRF_SECRET]"
   ENCRYPTION_KEY="[Your 32-character encryption key]"
   ```

### Step 3: Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Generate Prisma client
npx prisma generate

# Verify installation
npm list
```

### Step 4: Start Docker Services

1. **Start Services**
   ```bash
   # Start all services in detached mode
   docker-compose up -d
   
   # Verify services are running
   docker-compose ps
   ```

2. **Check Service Health**
   ```bash
   # Check PostgreSQL
   docker-compose logs postgres
   
   # Check MinIO
   docker-compose logs minio
   
   # Check if ports are available
   netstat -tulpn | grep -E '5433|9010|9011'
   ```

### Step 5: Initialize Database

1. **Run Migrations**
   ```bash
   # Apply database migrations
   npx prisma migrate deploy
   
   # Verify database schema
   npx prisma studio
   ```

2. **Seed Initial Data (Optional)**
   ```bash
   # Run seed script if available
   npx prisma db seed
   ```

### Step 6: Initialize MinIO Storage

```bash
# Run MinIO initialization script
node scripts/init-minio.js

# Verify bucket creation
# Access MinIO console at http://localhost:9011
# Default credentials: minioadmin/minioadmin
```

### Step 7: Start Development Server

```bash
# Start Next.js development server
npm run dev

# Server will start at http://localhost:3010
```

### Step 8: Create Admin User

```bash
# Option 1: Using script (requires running app)
node scripts/create-admin.js

# Option 2: Direct database insertion
node scripts/create-admin-direct.js
```

## Production Deployment

### Step 1: Prepare Production Environment

1. **Create Secrets Directory**
   ```bash
   mkdir -p secrets
   chmod 700 secrets
   ```

2. **Create Secret Files**
   ```bash
   # Database credentials
   echo "produser" > secrets/db_user.txt
   echo "$(openssl rand -base64 32)" > secrets/db_password.txt
   
   # MinIO credentials
   echo "$(openssl rand -hex 16)" > secrets/minio_access_key.txt
   echo "$(openssl rand -base64 32)" > secrets/minio_secret_key.txt
   
   # Set permissions
   chmod 600 secrets/*
   ```

### Step 2: Configure Production Environment

1. **Create .env.production**
   ```bash
   cp .env.example .env.production
   ```

2. **Update Production Values**
   ```env
   # Update URLs for production
   NEXTAUTH_URL="https://your-domain.com"
   MINIO_ENDPOINT="http://minio:9000"  # Internal Docker network
   
   # Update database URL with production credentials
   DATABASE_URL="postgresql://produser:${DB_PASSWORD}@postgres:5432/peoplefinder?sslmode=require"
   ```

### Step 3: Build and Deploy

1. **Build Production Image**
   ```bash
   # Build the application
   docker-compose -f docker-compose.prod.yml build
   ```

2. **Start Production Services**
   ```bash
   # Start all services
   docker-compose -f docker-compose.prod.yml up -d
   
   # Check logs
   docker-compose -f docker-compose.prod.yml logs -f
   ```

### Step 4: SSL/TLS Configuration

1. **Using Nginx Reverse Proxy**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       return 301 https://$server_name$request_uri;
   }
   
   server {
       listen 443 ssl http2;
       server_name your-domain.com;
       
       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;
       
       location / {
           proxy_pass http://localhost:3010;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

2. **Using Traefik (Alternative)**
   - Add Traefik labels to docker-compose.prod.yml
   - Configure automatic SSL with Let's Encrypt

## Post-Installation Configuration

### Step 1: Configure Admin Access

1. **First Admin Login**
   - Navigate to https://your-domain.com
   - Login with Azure AD credentials
   - Access admin panel at /admin/setup

2. **Import Azure AD Users**
   - Go to Admin → Import Users
   - Click "Sync from Azure AD"
   - Review and confirm import

### Step 2: Configure Roles and Permissions

1. **Default Roles**
   - Admin: Full system access
   - Manager: User and content management
   - Editor: Content editing
   - Viewer: Read-only access

2. **Assign Roles**
   - Navigate to Admin → Users
   - Click on user → Edit → Assign Role

### Step 3: Configure Storage

1. **MinIO Buckets**
   - Access MinIO console: http://localhost:9011
   - Create additional buckets if needed
   - Configure bucket policies

2. **Storage Limits**
   - Set maximum file size in environment variables
   - Configure allowed file types

### Step 4: Security Hardening

1. **Environment Variables**
   ```bash
   # Add to .env.production
   RATE_LIMIT_WINDOW=15
   RATE_LIMIT_MAX_REQUESTS=100
   SESSION_TIMEOUT=3600
   ENFORCE_MFA=true
   ```

2. **Database Security**
   ```sql
   -- Enable Row Level Security
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
   ```

3. **Network Security**
   - Configure firewall rules
   - Enable fail2ban
   - Set up monitoring

## Troubleshooting

### Common Issues

1. **Docker Services Won't Start**
   ```bash
   # Check port conflicts
   sudo lsof -i :3010
   sudo lsof -i :5433
   sudo lsof -i :9010
   
   # Check Docker logs
   docker-compose logs
   ```

2. **Database Connection Failed**
   ```bash
   # Test connection
   docker-compose exec postgres psql -U postgres -d peoplefinder
   
   # Check environment variables
   docker-compose exec app env | grep DATABASE
   ```

3. **Azure AD Login Issues**
   - Verify redirect URIs match exactly
   - Check client secret hasn't expired
   - Ensure API permissions are granted
   - Clear browser cookies and cache

4. **MinIO Connection Issues**
   ```bash
   # Check MinIO health
   curl http://localhost:9010/minio/health/live
   
   # Verify credentials
   docker-compose exec minio mc admin info local
   ```

### Debug Mode

1. **Enable Debug Logging**
   ```env
   # Add to .env
   DEBUG=*
   NODE_ENV=development
   ```

2. **Check Application Logs**
   ```bash
   # Next.js logs
   docker-compose logs -f app
   
   # Database queries
   docker-compose exec app npx prisma studio
   ```

### Health Checks

1. **Application Health**
   ```bash
   curl http://localhost:3010/api/health
   ```

2. **Database Health**
   ```bash
   docker-compose exec postgres pg_isready
   ```

3. **Storage Health**
   ```bash
   curl http://localhost:9010/minio/health/ready
   ```

## Maintenance

### Regular Tasks

1. **Database Backups**
   ```bash
   # Backup database
   docker-compose exec postgres pg_dump -U postgres peoplefinder > backup.sql
   
   # Restore database
   docker-compose exec -T postgres psql -U postgres peoplefinder < backup.sql
   ```

2. **Update Dependencies**
   ```bash
   # Update Node packages
   npm update
   
   # Update Docker images
   docker-compose pull
   ```

3. **Certificate Renewal**
   - Set up automatic renewal with certbot
   - Monitor expiration dates

### Monitoring Setup

1. **Prometheus Metrics**
   - Add prometheus endpoint
   - Configure Grafana dashboards

2. **Log Aggregation**
   - Configure ELK stack
   - Set up log rotation

3. **Alerts**
   - Set up email/SMS alerts
   - Configure uptime monitoring

## Support

For issues or questions:
- Check logs first: `docker-compose logs`
- Review Azure AD configuration
- Verify environment variables
- Check database connectivity

Remember to always backup your data before making significant changes!