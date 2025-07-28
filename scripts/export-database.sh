#!/bin/bash

# Export database data from local People Finder instance
# This script exports all employee-related data while preserving relationships

set -e

# Configuration
CONTAINER_NAME="people-finder-dev-postgres"
DB_NAME="people_finder"
DB_USER="postgres"
DB_PASSWORD="devpassword123"
EXPORT_DIR="./database-export"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
EXPORT_FILE="people_finder_export_${TIMESTAMP}.sql"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}People Finder Database Export Tool${NC}"
echo "===================================="

# Create export directory
mkdir -p "$EXPORT_DIR"

# Check if container is running
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo -e "${RED}Error: PostgreSQL container '$CONTAINER_NAME' is not running${NC}"
    echo "Please start the container with: docker-compose up -d postgres"
    exit 1
fi

echo -e "${YELLOW}Exporting database from local instance...${NC}"

# Export specific tables in the correct order (respecting foreign key constraints)
TABLES=(
    "users"
    "employees"
    "contracts"
    "contract_documents"
    "diplomas"
    "diploma_documents"
    "skills"
    "documents"
    "audit_logs"
    "accounts"
    "sessions"
    "verificationtokens"
)

# Create export file with header
cat > "$EXPORT_DIR/$EXPORT_FILE" << EOF
-- People Finder Database Export
-- Generated on: $(date)
-- 
-- This export contains all employee data and related records
-- Import this on your server instance to migrate the data

-- Disable foreign key checks during import
SET session_replication_role = 'replica';

-- Clean existing data (optional - uncomment if you want to replace all data)
-- TRUNCATE TABLE documents, skills, diploma_documents, diplomas, contract_documents, contracts, employees CASCADE;

EOF

# Export each table
for TABLE in "${TABLES[@]}"; do
    echo -e "Exporting table: ${TABLE}..."
    
    # Add table comment
    echo -e "\n-- Table: ${TABLE}" >> "$EXPORT_DIR/$EXPORT_FILE"
    
    # Export table data
    docker exec "$CONTAINER_NAME" pg_dump \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --data-only \
        --inserts \
        --column-inserts \
        --table="$TABLE" \
        >> "$EXPORT_DIR/$EXPORT_FILE" 2>/dev/null || {
            echo -e "${YELLOW}Warning: Table ${TABLE} might not exist or is empty${NC}"
        }
done

# Add footer to export file
cat >> "$EXPORT_DIR/$EXPORT_FILE" << EOF

-- Re-enable foreign key checks
SET session_replication_role = 'origin';

-- Update sequences
SELECT setval('employees_id_seq', (SELECT MAX(id) FROM employees), true) WHERE EXISTS (SELECT 1 FROM employees);
SELECT setval('contracts_id_seq', (SELECT MAX(id) FROM contracts), true) WHERE EXISTS (SELECT 1 FROM contracts);
SELECT setval('diplomas_id_seq', (SELECT MAX(id) FROM diplomas), true) WHERE EXISTS (SELECT 1 FROM diplomas);
SELECT setval('skills_id_seq', (SELECT MAX(id) FROM skills), true) WHERE EXISTS (SELECT 1 FROM skills);

-- Export completed successfully
EOF

# Create a compressed backup
echo -e "${YELLOW}Creating compressed backup...${NC}"
gzip -c "$EXPORT_DIR/$EXPORT_FILE" > "$EXPORT_DIR/${EXPORT_FILE}.gz"

# Generate summary
echo -e "\n${GREEN}Export completed successfully!${NC}"
echo "================================"
echo "Export file: $EXPORT_DIR/$EXPORT_FILE"
echo "Compressed: $EXPORT_DIR/${EXPORT_FILE}.gz"
echo -e "File size: $(ls -lh "$EXPORT_DIR/$EXPORT_FILE" | awk '{print $5}')"
echo -e "Compressed size: $(ls -lh "$EXPORT_DIR/${EXPORT_FILE}.gz" | awk '{print $5}')"

# Count records
echo -e "\n${YELLOW}Record counts:${NC}"
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "
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
echo "1. Copy the export file to your server:"
echo "   scp $EXPORT_DIR/${EXPORT_FILE}.gz user@your-server:/path/to/import/"
echo ""
echo "2. On the server, run the import script:"
echo "   ./scripts/import-database.sh /path/to/import/${EXPORT_FILE}.gz"