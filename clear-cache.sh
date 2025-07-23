#!/bin/bash
# Clear Next.js cache and rebuild

echo "Clearing Next.js cache..."
rm -rf .next
rm -rf node_modules/.cache

echo "Rebuilding Docker containers..."
docker compose down
docker compose build --no-cache
docker compose up -d

echo "Waiting for services to start..."
sleep 10

echo "Applying database migration..."
docker cp database/migrate-to-employees.sql people-finder-containerized-postgres-1:/tmp/migrate-to-employees.sql
docker exec people-finder-containerized-postgres-1 psql -U postgres -d peoplefinder -f /tmp/migrate-to-employees.sql

echo "Done! Please clear your browser cache and try again."
echo "Visit http://localhost:3010"