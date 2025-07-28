#!/bin/bash

# Initialize admin user for People Finder
# Usage: ./init-admin.sh "email@example.com" "Full Name" "azure-id"

if [ $# -ne 3 ]; then
    echo "Usage: $0 <email> <name> <azure-id>"
    echo "Example: $0 'admin@company.com' 'John Doe' '12345-67890'"
    exit 1
fi

EMAIL=$1
NAME=$2
AZURE_ID=$3

echo "Creating admin user..."
echo "Email: $EMAIL"
echo "Name: $NAME"
echo "Azure ID: $AZURE_ID"

# Make API call to create admin user
curl -X POST http://localhost:3010/api/setup/init-admin \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"name\":\"$NAME\",\"azureId\":\"$AZURE_ID\"}" \
  -w "\n"

echo "Admin user created. You can now login with Azure AD."