# ⚡ Quick Deploy Guide

**Deploy People Finder in 5 minutes on your Hetzner server with Cloudflare Tunnels**

## 🚀 One-Command Deployment

```bash
# SSH to your server
ssh root@your-hetzner-server

# Clone and deploy
git clone https://github.com/your-username/People-Finder-Containerized.git /opt/people-finder
cd /opt/people-finder
cp .env.cloudflare.example .env.cloudflare

# Edit environment (required!)
nano .env.cloudflare
# Set: NEXTAUTH_URL, AZURE_AD_*, POSTGRES_PASSWORD, MINIO_ROOT_PASSWORD

# Deploy
chmod +x deploy-cloudflare.sh && ./deploy-cloudflare.sh
```

## 📝 Required Environment Variables

**Minimal required settings in `.env.cloudflare`:**

```env
NEXTAUTH_URL=https://people.yourdomain.com
NEXTAUTH_SECRET=$(openssl rand -base64 32)
POSTGRES_PASSWORD=$(openssl rand -base64 32)
MINIO_ROOT_PASSWORD=$(openssl rand -base64 32)

# Azure AD (get from Azure portal)
AZURE_AD_CLIENT_ID=your-app-id
AZURE_AD_CLIENT_SECRET=your-client-secret  
AZURE_AD_TENANT_ID=your-tenant-id
```

## 🌐 Cloudflare Tunnel Setup

Add to your tunnel config:

```yaml
ingress:
  - hostname: people.yourdomain.com
    service: http://localhost:3020
  - service: http_status:404  # keep last
```

Restart tunnel: `sudo systemctl restart cloudflared`

## ✅ Verify Deployment

```bash
# Check if running
docker-compose -f docker-compose.cloudflare.yml ps

# Test health
curl http://localhost:3020/api/health

# View logs if issues
docker-compose -f docker-compose.cloudflare.yml logs -f
```

## 🎉 Access Your App

Visit `https://people.yourdomain.com` → Complete setup → Create admin user → Done!

**Total time: ~5 minutes** ⏱️