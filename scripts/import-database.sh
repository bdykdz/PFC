#!/bin/bash

# Import database data to server People Finder instance
# This script imports employee data while preserving existing users and settings

set -e

# Configuration
DB_CONTAINER_NAME="people-finder-postgres-1"  # Default docker-compose service name
DB_NAME="people_finder"
DB_USER="postgres"
IMPORT_FILE="$1"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}People Finder Database Import Tool${NC}"
echo "===================================="

# Check if import file is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: No import file specified${NC}"
    echo "Usage: $0 <import-file.sql.gz>"
    exit 1
fi

# Check if file exists
if [ ! -f "$IMPORT_FILE" ]; then
    echo -e "${RED}Error: Import file not found: $IMPORT_FILE${NC}"
    exit 1
fi

# Get database password from environment or Docker secrets
if [ -z "$DB_PASSWORD" ]; then
    if [ -f "./secrets/db_password.txt" ]; then
        DB_PASSWORD=$(cat ./secrets/db_password.txt)
    else
        echo -e "${YELLOW}Warning: No database password found in environment or secrets${NC}"
        echo "Please set DB_PASSWORD environment variable or create ./secrets/db_password.txt"
        read -sp "Enter database password: " DB_PASSWORD
        echo
    fi
fi

# Check if container is running
if ! docker ps | grep -q "$DB_CONTAINER_NAME"; then
    echo -e "${YELLOW}Container '$DB_CONTAINER_NAME' not found. Checking alternative names...${NC}"
    
    # Try to find the postgres container
    POSTGRES_CONTAINER=$(docker ps --format "table {{.Names}}" | grep -E "(postgres|people.*finder.*postgres)" | head -1)
    
    if [ -z "$POSTGRES_CONTAINER" ]; then
        echo -e "${RED}Error: No PostgreSQL container found${NC}"
        echo "Available containers:"
        docker ps --format "table {{.Names}}"
        exit 1
    else
        DB_CONTAINER_NAME="$POSTGRES_CONTAINER"
        echo -e "${GREEN}Found PostgreSQL container: $DB_CONTAINER_NAME${NC}"
    fi
fi

# Create backup of current data
BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./database-backup"
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}Creating backup of current database...${NC}"
docker exec "$DB_CONTAINER_NAME" pg_dump \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --no-owner \
    | gzip > "$BACKUP_DIR/backup_before_import_${BACKUP_TIMESTAMP}.sql.gz"

echo -e "${GREEN}Backup created: $BACKUP_DIR/backup_before_import_${BACKUP_TIMESTAMP}.sql.gz${NC}"

# Prepare import file
TEMP_DIR="/tmp/people_finder_import_$$"
mkdir -p "$TEMP_DIR"

echo -e "${YELLOW}Preparing import file...${NC}"
if [[ "$IMPORT_FILE" == *.gz ]]; then
    gunzip -c "$IMPORT_FILE" > "$TEMP_DIR/import.sql"
else
    cp "$IMPORT_FILE" "$TEMP_DIR/import.sql"
fi

# Show current record counts
echo -e "\n${YELLOW}Current database state:${NC}"
docker exec "$DB_CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 
    'Employees' as table_name, COUNT(*) as count FROM employees
UNION ALL
SELECT 'Contracts', COUNT(*) FROM contracts
UNION ALL
SELECT 'Diplomas', COUNT(*) FROM diplomas
UNION ALL
SELECT 'Skills', COUNT(*) FROM skills
UNION ALL
SELECT 'Documents', COUNT(*) FROM documents;
" | grep -E '^\s*(Employees|Contracts|Diplomas|Skills|Documents)'

# Confirm import
echo -e "\n${YELLOW}This will import employee data from: $IMPORT_FILE${NC}"
echo -e "${YELLOW}A backup has been created at: $BACKUP_DIR/backup_before_import_${BACKUP_TIMESTAMP}.sql.gz${NC}"
read -p "Do you want to continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Import cancelled"
    rm -rf "$TEMP_DIR"
    exit 0
fi

# Import the data
echo -e "\n${YELLOW}Importing data...${NC}"
docker cp "$TEMP_DIR/import.sql" "$DB_CONTAINER_NAME":/tmp/import.sql

# Execute import
docker exec "$DB_CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -f /tmp/import.sql > /dev/null 2>&1 || {
    echo -e "${RED}Error during import!${NC}"
    echo "You can restore the backup with:"
    echo "gunzip -c $BACKUP_DIR/backup_before_import_${BACKUP_TIMESTAMP}.sql.gz | docker exec -i $DB_CONTAINER_NAME psql -U $DB_USER -d $DB_NAME"
    rm -rf "$TEMP_DIR"
    exit 1
}

# Clean up
docker exec "$DB_CONTAINER_NAME" rm /tmp/import.sql
rm -rf "$TEMP_DIR"

# Show new record counts
echo -e "\n${GREEN}Import completed successfully!${NC}"
echo -e "\n${YELLOW}New database state:${NC}"
docker exec "$DB_CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 
    'Employees' as table_name, COUNT(*) as count FROM employees
UNION ALL
SELECT 'Contracts', COUNT(*) FROM contracts
UNION ALL
SELECT 'Diplomas', COUNT(*) FROM diplomas
UNION ALL
SELECT 'Skills', COUNT(*) FROM skills
UNION ALL
SELECT 'Documents', COUNT(*) FROM documents;
" | grep -E '^\s*(Employees|Contracts|Diplomas|Skills|Documents)'

echo -e "\n${GREEN}Next steps:${NC}"
echo "1. Restart the application to ensure all caches are cleared:"
echo "   docker-compose restart app"
echo ""
echo "2. Verify the imported data in the web interface"
echo ""
echo "3. If you need to rollback, use:"
echo "   gunzip -c $BACKUP_DIR/backup_before_import_${BACKUP_TIMESTAMP}.sql.gz | docker exec -i $DB_CONTAINER_NAME psql -U $DB_USER -d $DB_NAME"