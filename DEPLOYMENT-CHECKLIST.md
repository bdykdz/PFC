# 📋 Deployment Checklist

Use this checklist to ensure a smooth deployment of People Finder on your server.

## ✅ Pre-Deployment

### Server Requirements
- [ ] Server with 2GB+ RAM and Docker installed
- [ ] Cloudflare account with tunnels configured  
- [ ] Domain name managed by Cloudflare
- [ ] SSH access to the server

### Azure AD Setup
- [ ] Azure AD app registration created
- [ ] Redirect URI configured: `https://your-domain.com/api/auth/callback/azure-ad`
- [ ] API permissions granted (User.Read, User.ReadBasic.All)
- [ ] Client secret generated and saved securely

### Repository Setup
- [ ] Code pushed to GitHub repository
- [ ] Repository is private (recommended for security)

## 🚀 Deployment Steps

### 1. Server Setup
```bash
# SSH to your server
ssh root@your-hetzner-server

# Clone repository
git clone https://github.com/your-username/People-Finder-Containerized.git /opt/people-finder
cd /opt/people-finder
```

### 2. Environment Configuration
```bash
# Create environment file
cp .env.cloudflare.example .env.cloudflare

# Edit with your values
nano .env.cloudflare
```

**Required variables:**
- [ ] `NEXTAUTH_URL` - Your full domain (https://people.yourdomain.com)
- [ ] `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- [ ] `POSTGRES_PASSWORD` - Generate with: `openssl rand -base64 32`
- [ ] `MINIO_ROOT_PASSWORD` - Generate with: `openssl rand -base64 32`
- [ ] `AZURE_AD_CLIENT_ID` - From Azure portal
- [ ] `AZURE_AD_CLIENT_SECRET` - From Azure portal
- [ ] `AZURE_AD_TENANT_ID` - From Azure portal

### 3. Deploy Application
```bash
# Make script executable and deploy
chmod +x deploy-cloudflare.sh
./deploy-cloudflare.sh
```

### 4. Configure Cloudflare Tunnel
- [ ] Add hostname mapping in Cloudflare Zero Trust dashboard
- [ ] Point `people.yourdomain.com` to `http://localhost:3020`
- [ ] Restart cloudflared service
- [ ] Test tunnel connectivity

## ✅ Post-Deployment Verification

### Application Health
- [ ] Application responds: `curl http://localhost:3020/api/health`
- [ ] Containers running: `docker-compose -f docker-compose.cloudflare.yml ps`
- [ ] No error logs: `docker-compose -f docker-compose.cloudflare.yml logs`

### External Access
- [ ] Domain resolves correctly
- [ ] HTTPS works (Cloudflare handles SSL)
- [ ] Setup page loads: `https://people.yourdomain.com/setup`

### Initial Setup
- [ ] Complete initial setup wizard
- [ ] Create first admin user
- [ ] Test Azure AD authentication
- [ ] Verify admin panel access
- [ ] Test file upload functionality

### Security Verification
- [ ] Only localhost:3020 is exposed (no external ports)
- [ ] Database and MinIO are not externally accessible
- [ ] Admin panel requires proper authentication
- [ ] User roles work correctly (Viewer, Editor, Admin)

## 🔧 Optional Optimizations

### GitHub Actions (Optional)
If you want automatic deployments:

1. Add repository secrets:
   - [ ] `SERVER_HOST` - Your server IP
   - [ ] `SERVER_USER` - SSH username (usually root)
   - [ ] `SERVER_SSH_KEY` - Your private SSH key

2. Push to main branch to trigger deployment

### Monitoring Setup (Optional)
- [ ] Set up log rotation
- [ ] Configure backup cron job
- [ ] Monitor disk space usage
- [ ] Set up uptime monitoring

### Performance Tuning (Optional)
- [ ] Enable Cloudflare caching rules
- [ ] Configure Cloudflare security settings
- [ ] Set up database connection pooling

## 🆘 Troubleshooting

### Application Won't Start
```bash
# Check container logs
docker-compose -f docker-compose.cloudflare.yml logs app

# Common issues:
# - Database connection failed (check POSTGRES_PASSWORD)
# - Missing environment variables
# - Port 3020 already in use
```

### Database Issues
```bash
# Check database logs
docker-compose -f docker-compose.cloudflare.yml logs postgres

# Reset database if needed (DESTROYS DATA!)
docker-compose -f docker-compose.cloudflare.yml down -v
./deploy-cloudflare.sh
```

### Cloudflare Tunnel Issues
```bash
# Check tunnel status
sudo systemctl status cloudflared

# Restart tunnel
sudo systemctl restart cloudflared

# Check tunnel logs
sudo journalctl -u cloudflared -f
```

### Azure AD Authentication Issues
- [ ] Verify redirect URI matches exactly
- [ ] Check client secret hasn't expired
- [ ] Ensure NEXTAUTH_URL matches your domain
- [ ] Verify tenant ID is correct

## 📝 Maintenance Commands

```bash
# Update application
cd /opt/people-finder
git pull origin main
./deploy-cloudflare.sh

# View logs
docker-compose -f docker-compose.cloudflare.yml logs -f

# Backup database
docker-compose -f docker-compose.cloudflare.yml exec postgres pg_dump -U postgres people_finder > backup_$(date +%Y%m%d).sql

# Check resource usage
docker stats --no-stream
```

## 🎯 Success Criteria

Your deployment is successful when:

- [ ] ✅ Application loads at your domain
- [ ] ✅ Azure AD login works
- [ ] ✅ Admin can create/manage users  
- [ ] ✅ File uploads work
- [ ] ✅ Search functionality works
- [ ] ✅ All health checks pass
- [ ] ✅ No error logs in containers

**Estimated deployment time: 10-15 minutes** ⏱️

---

**Need help?** Check the troubleshooting section or create an issue in the GitHub repository.