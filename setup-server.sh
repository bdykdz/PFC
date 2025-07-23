#!/bin/bash

# Server Setup Script for People Finder
# Run this script on your remote server

set -e

echo "🖥️  Setting up server for People Finder deployment..."

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install required packages
echo "🛠️  Installing required packages..."
apt install -y curl git ufw fail2ban htop nano

# Install Docker
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
    usermod -aG docker $USER
    rm get-docker.sh
else
    echo "✅ Docker already installed"
fi

# Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "🐙 Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    echo "✅ Docker Compose already installed"
fi

# Setup firewall
echo "🔥 Configuring firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Setup fail2ban
echo "🛡️  Configuring fail2ban..."
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = %(sshd_log)s
backend = %(sshd_backend)s

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
EOF

systemctl enable fail2ban
systemctl start fail2ban

# Create app directory
echo "📁 Creating application directory..."
mkdir -p /opt/people-finder
cd /opt/people-finder

# Set up log rotation
echo "📜 Setting up log rotation..."
cat > /etc/logrotate.d/people-finder << EOF
/opt/people-finder/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0644 root root
}
EOF

# Create secrets directory with proper permissions
echo "🔐 Creating secrets directory..."
mkdir -p /opt/people-finder/secrets
chmod 700 /opt/people-finder/secrets

# Setup systemd service for auto-start
echo "🔄 Setting up systemd service..."
cat > /etc/systemd/system/people-finder.service << EOF
[Unit]
Description=People Finder Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/people-finder
ExecStart=/usr/local/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.prod.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable people-finder

# Setup backup script
echo "💾 Setting up backup script..."
cat > /opt/people-finder/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/people-finder"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup database
docker-compose -f /opt/people-finder/docker-compose.prod.yml exec -T postgres pg_dump -U postgres people_finder > "$BACKUP_DIR/db_backup_$DATE.sql"

# Backup MinIO data
docker run --rm -v people-finder_minio_data:/source -v $BACKUP_DIR:/backup alpine tar czf /backup/minio_backup_$DATE.tar.gz -C /source .

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /opt/people-finder/backup.sh

# Setup daily backup cron job
echo "⏰ Setting up daily backups..."
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/people-finder/backup.sh >> /var/log/people-finder-backup.log 2>&1") | crontab -

# Display next steps
echo ""
echo "✅ Server setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Copy your application files to /opt/people-finder"
echo "2. Create secret files in /opt/people-finder/secrets/:"
echo "   - db_user.txt"
echo "   - db_password.txt" 
echo "   - minio_access_key.txt"
echo "   - minio_secret_key.txt"
echo "3. Create .env.production file with all environment variables"
echo "4. Get SSL certificates and place them in /opt/people-finder/nginx/certs/"
echo "5. Run the deployment script: ./deploy.sh"
echo ""
echo "🔧 Useful commands:"
echo "- Check status: systemctl status people-finder"
echo "- View logs: journalctl -u people-finder -f"
echo "- Manual backup: /opt/people-finder/backup.sh"
echo ""
echo "🔄 Reboot required to complete Docker setup for current user"