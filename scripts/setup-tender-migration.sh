#!/bin/bash

echo "🔄 Setting up Tender Fields Migration"
echo "==================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "prisma/schema.prisma" ]; then
    print_error "Error: prisma/schema.prisma not found!"
    echo "Please run this script from the People Finder root directory."
    exit 1
fi

print_status "Generating Prisma client..."
npx prisma generate

print_status "Creating database migration..."
npx prisma migrate dev --name add_tender_fields

print_status "Verifying migration..."
npx prisma migrate status

echo ""
echo "🎉 Tender fields migration completed!"
echo ""
echo "New fields added to employees:"
echo "  • project_categories (JSONB)"
echo "  • security_clearance (String)"  
echo "  • availability_status (String, default: 'Available')"
echo "  • hourly_rate (Decimal)"
echo "  • languages (JSONB)"
echo "  • is_key_expert (Boolean, default: false)"
echo "  • years_experience (Integer)"
echo "  • location (String)"
echo "  • certifications (JSONB)"
echo ""
echo "New tables created:"
echo "  • tender_projects"
echo "  • tender_teams"
echo "  • tender_team_members"
echo ""
print_warning "Next steps:"
echo "1. Update existing employee records with default values"
echo "2. Build the Team Builder UI"
echo "3. Create enhanced search filters"