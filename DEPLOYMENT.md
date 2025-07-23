# 🚀 People Finder Deployment Guide

This guide covers deploying the People Finder application to a remote server using Docker.

## 📋 Prerequisites

- Remote server with Ubuntu 20.04+ (2GB RAM, 2 CPU cores, 20GB disk minimum)
- Domain name pointed to your server IP
- SSH access to the server
- Azure AD app registration for authentication

## 🖥️ Server Setup

### 1. Initial Server Configuration

```bash
# SSH into your server
ssh root@your-server-ip

# Run the server setup script
curl -fsSL https://raw.githubusercontent.com/your-repo/People-Finder-Containerized/main/setup-server.sh | bash

# Reboot to complete setup
reboot
```

### 2. Clone Application

```bash
# SSH back into server after reboot
ssh root@your-server-ip

cd /opt/people-finder
git clone https://github.com/your-username/People-Finder-Containerized.git .
```

## 🔐 Security Configuration

### 1. Create Secret Files

```bash
# Create secure secret files
cd /opt/people-finder/secrets

# Database credentials
echo "postgres" > db_user.txt
echo "$(openssl rand -base64 32)" > db_password.txt

# MinIO credentials  
echo "admin" > minio_access_key.txt
echo "$(openssl rand -base64 32)" > minio_secret_key.txt

# Secure permissions
chmod 600 secrets/*.txt
```

### 2. Environment Configuration

```bash
# Create production environment file
cp .env.example .env.production
nano .env.production
```

**Required Environment Variables:**

```env
# Application
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Database
DB_NAME=people_finder
DB_USER=postgres
DB_PASSWORD=your-secure-db-password

# Azure AD Authentication
AZURE_AD_CLIENT_ID=your-azure-app-id
AZURE_AD_CLIENT_SECRET=your-azure-client-secret
AZURE_AD_TENANT_ID=your-tenant-id

# File Storage
MINIO_BUCKET_NAME=people-finder-docs
MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=your-secure-minio-password

# Optional: SMTP for notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 3. SSL Certificates

**Option A: Let's Encrypt (Recommended for production)**

```bash
# Install certbot
apt install snapd
snap install core; snap refresh core
snap install --classic certbot
ln -s /snap/bin/certbot /usr/bin/certbot

# Get certificates
certbot certonly --standalone -d your-domain.com

# Copy certificates to nginx directory
mkdir -p /opt/people-finder/nginx/certs
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem /opt/people-finder/nginx/certs/
cp /etc/letsencrypt/live/your-domain.com/privkey.pem /opt/people-finder/nginx/certs/

# Setup auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet && docker-compose -f /opt/people-finder/docker-compose.prod.yml restart nginx" | crontab -
```

**Option B: Self-signed (Testing only)**

```bash
# Self-signed certificates will be created automatically by deploy script
# Not recommended for production use
```

## 🚀 Deployment

### 1. Deploy Application

```bash
cd /opt/people-finder

# Make deployment script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh production
```

### 2. Verify Deployment

```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# Check application health
curl https://your-domain.com/health

# View logs if needed
docker-compose -f docker-compose.prod.yml logs -f
```

## 🔧 Management Commands

### Application Management

```bash
# Start services
systemctl start people-finder

# Stop services  
systemctl stop people-finder

# Restart services
systemctl restart people-finder

# View status
systemctl status people-finder

# View logs
docker-compose -f docker-compose.prod.yml logs -f [service-name]
```

### Updates and Maintenance

```bash
# Update application
cd /opt/people-finder
git pull origin main
./deploy.sh production

# Database backup (automatic daily at 2 AM)
./backup.sh

# Database restore
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d people_finder < backup.sql

# Scale application (if needed)
docker-compose -f docker-compose.prod.yml up -d --scale app=2
```

## 🐛 Troubleshooting

### Common Issues

**1. SSL Certificate Issues**
```bash
# Check certificate validity
openssl x509 -in nginx/certs/fullchain.pem -text -noout

# Renew certificates
certbot renew --force-renewal
```

**2. Database Connection Issues**
```bash
# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres

# Connect to database manually
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d people_finder
```

**3. Memory Issues**
```bash
# Check memory usage
docker stats

# Restart services to free memory
docker-compose -f docker-compose.prod.yml restart
```

**4. Storage Issues**
```bash
# Clean up unused Docker resources
docker system prune -a

# Check disk usage
df -h
du -sh /var/lib/docker/
```

## 📊 Monitoring

### Health Checks

```bash
# Application health
curl https://your-domain.com/api/health

# Service status
docker-compose -f docker-compose.prod.yml ps

# Resource usage
docker stats --no-stream
```

### Log Monitoring

```bash
# Application logs
docker-compose -f docker-compose.prod.yml logs -f app

# Nginx access logs
docker-compose -f docker-compose.prod.yml logs -f nginx

# Database logs
docker-compose -f docker-compose.prod.yml logs -f postgres
```

## 🔒 Security Best Practices

1. **Keep system updated**
   ```bash
   apt update && apt upgrade -y
   ```

2. **Monitor failed login attempts**
   ```bash
   fail2ban-client status sshd
   ```

3. **Regular security audits**
   ```bash
   # Check for unauthorized access
   last -n 20
   
   # Monitor file changes
   find /opt/people-finder -type f -mtime -1
   ```

4. **Backup verification**
   ```bash
   # Test backup restore periodically
   ./backup.sh
   # Verify backup files exist and are not corrupted
   ```

## 🌐 Alternative Deployment Options

### Cloud Platforms

**AWS ECS/Fargate**
- Use provided docker-compose.yml as reference for task definitions
- Set up Application Load Balancer for SSL termination
- Use RDS for PostgreSQL and S3 for file storage

**Google Cloud Run**
- Deploy each service separately
- Use Cloud SQL for database
- Use Cloud Storage for files

**Azure Container Instances**
- Deploy using Azure Container Groups
- Use Azure Database for PostgreSQL
- Use Azure Blob Storage for files

**DigitalOcean App Platform**
- Use their Docker deployment option
- Managed database and storage services available

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section
2. Review application logs
3. Ensure all environment variables are correctly set
4. Verify network connectivity between containers
5. Check server resources (CPU, memory, disk)

For additional support, please check the project documentation or create an issue in the repository.