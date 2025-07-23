#!/bin/bash

echo "🚀 People Finder Docker Status"
echo "=============================="
echo ""

# Check services
echo "📦 Services Status:"
docker-compose ps
echo ""

# Check health
echo "💚 Health Check:"
curl -s http://localhost:3010/api/health | jq . 2>/dev/null || echo "Health check failed"
echo ""

# URLs
echo "🌐 Access URLs:"
echo "  - Application: http://localhost:3010"
echo "  - MinIO Console: http://localhost:9011 (minioadmin/minioadmin)"
echo "  - PostgreSQL: localhost:5433 (postgres/postgres)"
echo ""

# Logs command
echo "📝 View logs with: docker-compose logs -f app"