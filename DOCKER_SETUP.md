# Docker Setup Guide

This guide provides instructions for running the People Finder application using Docker.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB of available RAM
- 10GB of free disk space

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd People-Finder-Containerized
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```

3. **Configure environment variables**
   Edit `.env` and set:
   - `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
   - `AZURE_AD_CLIENT_ID` - Your Azure AD app client ID
   - `AZURE_AD_CLIENT_SECRET` - Your Azure AD app client secret
   - `AZURE_AD_TENANT_ID` - Your Azure AD tenant ID

4. **Build and start services**
   ```bash
   docker-compose up -d --build
   ```

5. **Run database migrations**
   ```bash
   ./scripts/docker-migrate.sh
   ```

6. **Access the application**
   - Application: http://localhost:3010
   - MinIO Console: http://localhost:9011 (admin/minioadmin)
   - PostgreSQL: localhost:5433 (postgres/postgres)

## Development Setup

For development with hot reloading:

```bash
# Start services with development overrides
docker-compose up -d

# View logs
docker-compose logs -f app

# Rebuild after dependency changes
docker-compose build app
docker-compose up -d
```

## Production Deployment

1. **Create production environment file**
   ```bash
   cp .env.production.example .env.production
   ```

2. **Create Docker secrets**
   ```bash
   echo "your-db-username" | docker secret create db_user -
   echo "your-db-password" | docker secret create db_password -
   echo "your-nextauth-secret" | docker secret create nextauth_secret -
   echo "your-minio-access-key" | docker secret create minio_access_key -
   echo "your-minio-secret-key" | docker secret create minio_secret_key -
   ```

3. **Deploy with production configuration**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

## Common Operations

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
```

### Execute commands in containers
```bash
# Run Prisma migrations
docker-compose exec app npx prisma migrate deploy

# Generate Prisma client
docker-compose exec app npx prisma generate

# Access PostgreSQL
docker-compose exec postgres psql -U postgres -d peoplefinder

# Access app shell
docker-compose exec app sh
```

### Backup and restore

**Backup database:**
```bash
docker-compose exec postgres pg_dump -U postgres peoplefinder > backup.sql
```

**Restore database:**
```bash
docker-compose exec -T postgres psql -U postgres peoplefinder < backup.sql
```

**Backup MinIO data:**
```bash
docker run --rm -v people-finder-containerized_minio_data:/data -v $(pwd):/backup alpine tar czf /backup/minio-backup.tar.gz -C /data .
```

### Clean up
```bash
# Stop and remove containers
docker-compose down

# Remove volumes (WARNING: deletes all data)
docker-compose down -v

# Remove all (containers, volumes, images)
docker-compose down -v --rmi all
```

## Troubleshooting

### Container won't start
- Check logs: `docker-compose logs app`
- Verify environment variables are set correctly
- Ensure ports 3010, 5433, 9010, 9011 are not in use

### Database connection errors
- Wait for PostgreSQL to be ready: `docker-compose ps`
- Check DATABASE_URL in environment
- Verify PostgreSQL is healthy: `docker-compose exec postgres pg_isready`

### MinIO errors
- Ensure MinIO is running: `docker-compose ps minio`
- Check MinIO credentials match environment variables
- Verify bucket exists or will be created on first upload

### Build failures
- Clear Docker cache: `docker-compose build --no-cache`
- Check Node.js version compatibility
- Verify all dependencies are in package.json

## Architecture

The Docker setup consists of:

- **app**: Next.js application (Node.js 20 Alpine)
- **postgres**: PostgreSQL 16 database
- **minio**: S3-compatible object storage
- **nginx**: Reverse proxy (production only)

Networks:
- **frontend**: External-facing network
- **backend**: Internal services network

Volumes:
- **postgres_data**: Database persistence
- **minio_data**: Object storage persistence

## Security Considerations

Production deployment includes:
- Non-root user execution
- Read-only filesystem (where possible)
- Docker secrets for sensitive data
- Network isolation
- SSL/TLS support
- Security headers via nginx

## Performance Tuning

For better performance:

1. Increase Docker resources in Docker Desktop settings
2. Use production build: `NODE_ENV=production`
3. Enable BuildKit: `DOCKER_BUILDKIT=1`
4. Use multi-stage caching effectively

## Updates and Maintenance

1. **Update dependencies**
   ```bash
   docker-compose build --no-cache app
   docker-compose up -d
   ```

2. **Update database schema**
   ```bash
   docker-compose exec app npx prisma migrate deploy
   ```

3. **Update Docker images**
   ```bash
   docker-compose pull
   docker-compose up -d
   ```