# 👥 People Finder - Professional Profile Management System

A comprehensive Next.js application for managing professional profiles, contracts, skills, and organizational data with multilingual support (Romanian/English) and advanced search capabilities.

## ✨ Features

### 🔍 **Advanced Search & Discovery**
- Powerful query builder with AND/OR logic
- 15+ search fields (skills, experience, location, contracts, etc.)
- Saved searches with delete functionality
- Multilingual search interface

### 👤 **Profile Management**
- Complete employee profiles with contracts, skills, diplomas
- Document upload and management via MinIO
- User profile management with activity tracking
- Azure AD integration for authentication

### 🛠️ **Admin Panel**
- User management with role-based access (Viewer, Editor, Admin)
- Dropdown management for all system categories
- Employee data management with cascade deletion
- Activity logging and audit trails
- Azure AD user import functionality

### 🌍 **Multilingual Support**
- Full Romanian and English translations
- Language switcher in navigation
- All new features fully internationalized

### 🔒 **Security & Access Control**
- Role-based permissions (Viewer, Editor, Admin)
- Azure Active Directory authentication
- Secure file storage with MinIO
- Activity logging for all actions

## 🚀 Quick Deployment (Cloudflare Tunnels)

### Prerequisites
- Server with Docker and Docker Compose
- Cloudflare account with tunnels set up
- Azure AD app registration
- Domain name managed by Cloudflare

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/your-username/People-Finder-Containerized.git
cd People-Finder-Containerized

# Create environment file
cp .env.cloudflare.example .env.cloudflare
nano .env.cloudflare
```

### 2. Configure Environment

Edit `.env.cloudflare` with your values:

```env
NEXTAUTH_URL=https://people.yourdomain.com
NEXTAUTH_SECRET=your-super-secret-key-min-32-chars
POSTGRES_PASSWORD=your-secure-db-password
AZURE_AD_CLIENT_ID=your-azure-app-id
AZURE_AD_CLIENT_SECRET=your-azure-client-secret
AZURE_AD_TENANT_ID=your-tenant-id
MINIO_ROOT_PASSWORD=your-secure-minio-password
```

### 3. Deploy

```bash
# Make deployment script executable
chmod +x deploy-cloudflare.sh

# Deploy the application
./deploy-cloudflare.sh
```

### 4. Configure Cloudflare Tunnel

Add to your tunnel configuration:

```yaml
ingress:
  - hostname: people.yourdomain.com
    service: http://localhost:3020
  # ... your other services
  - service: http_status:404
```

### 5. Access Your Application

Visit `https://people.yourdomain.com` and complete the initial setup!

## 🔧 Management Commands

```bash
# Application management
docker-compose -f docker-compose.cloudflare.yml ps          # Status
docker-compose -f docker-compose.cloudflare.yml logs -f     # Logs
docker-compose -f docker-compose.cloudflare.yml restart app # Restart

# Updates
git pull origin main && ./deploy-cloudflare.sh
```

## 🏗️ Architecture

- **Frontend**: Next.js 15.4.1 with App Router
- **Database**: PostgreSQL 16 with Prisma ORM
- **Authentication**: NextAuth.js with Azure AD
- **File Storage**: MinIO (S3-compatible)
- **Deployment**: Docker with Cloudflare Tunnels

## 📁 Key Files

```
├── deploy-cloudflare.sh              # One-command deployment
├── docker-compose.cloudflare.yml     # Cloudflare-optimized containers
├── .env.cloudflare.example           # Environment template
├── app/                              # Next.js application
├── prisma/                           # Database schema
└── nginx/                            # Nginx config (if needed)
```

## 🆘 Quick Troubleshooting

```bash
# Check application health
curl http://localhost:3020/api/health

# View logs
docker-compose -f docker-compose.cloudflare.yml logs -f app

# Restart if needed
docker-compose -f docker-compose.cloudflare.yml restart
```

---

**Ready for GitHub! Just clone and deploy with `./deploy-cloudflare.sh` 🚀**