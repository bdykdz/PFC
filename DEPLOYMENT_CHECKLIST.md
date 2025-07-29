# People Finder - Deployment Checklist

## Quick Deployment Steps

### 1. Prepare Environment File
```bash
cp .env.production.template .env.production
# Edit .env.production with your values
nano .env.production
```

**Must update:**
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `POSTGRES_PASSWORD` - Use a strong password
- `MINIO_ACCESS_KEY` and `MINIO_SECRET_KEY` - Change from defaults
- `NEXTAUTH_URL` - Your domain (e.g., https://people-finder.yourdomain.com)

### 2. Run Automated Deployment
```bash
./deploy-to-hetzner.sh YOUR_SERVER_IP
```

### 3. Post-Deployment Setup

#### Set up HTTPS (Recommended)
```bash
# SSH to server
ssh root@YOUR_SERVER_IP

# Install Nginx and Certbot
apt update && apt install nginx certbot python3-certbot-nginx -y

# Configure Nginx
nano /etc/nginx/sites-available/people-finder
```

Add this configuration:
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

Enable and secure:
```bash
ln -s /etc/nginx/sites-available/people-finder /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d your-domain.com
```

### 4. Security Configuration

#### Configure Firewall
```bash
# Allow SSH, HTTP, and HTTPS
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

### 5. Verify Deployment

Check services:
```bash
cd /opt/people-finder
docker-compose ps
```

Check logs:
```bash
docker-compose logs -f app
```

Test the application:
- Visit: https://your-domain.com (or http://YOUR_SERVER_IP:3000)
- Login with the admin credentials created during deployment

### 6. Configure Automated Backups

Create backup script:
```bash
nano /opt/people-finder/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/people-finder"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
docker-compose exec -T postgres pg_dump -U postgres peoplefinder > $BACKUP_DIR/db_$DATE.sql

# Backup uploaded files
tar -czf $BACKUP_DIR/files_$DATE.tar.gz -C /var/lib/docker/volumes/people_finder_minio/_data .

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

Make executable and add to cron:
```bash
chmod +x /opt/people-finder/backup.sh
crontab -e
# Add: 0 2 * * * /opt/people-finder/backup.sh
```

## Common Issues

### Docker not installed
```bash
curl -fsSL https://get.docker.com | sh
apt install docker-compose -y
```

### Permission denied errors
```bash
chmod -R 755 /opt/people-finder
```

### Services not starting
```bash
# Check logs
docker-compose logs

# Restart everything
docker-compose down
docker-compose up -d
```

### Document processing not working
```bash
# Check document processor logs
docker-compose logs document-processor

# Manually process documents
docker-compose exec app node scripts/process-all-documents.js
```

## Maintenance Commands

Update application:
```bash
cd /opt/people-finder
git pull
docker-compose build
docker-compose up -d
```

View real-time logs:
```bash
docker-compose logs -f app document-processor
```

Restart services:
```bash
docker-compose restart
```

## Support

For issues:
1. Check logs: `docker-compose logs`
2. Verify environment variables in `.env.production`
3. Ensure all services are healthy: `docker-compose ps`
4. Check disk space: `df -h`