#!/bin/bash

# Script to process all existing unprocessed documents in the database

echo "🔄 Processing existing documents..."

# Get the auth token first by logging in
echo "📝 Getting authentication token..."
AUTH_RESPONSE=$(curl -s -X POST http://localhost:3010/api/auth/session)

# Function to process a single document
process_document() {
    local doc_id=$1
    echo "  📄 Processing document: $doc_id"
    
    curl -s -X POST http://localhost:3010/api/documents/process \
        -H "Content-Type: application/json" \
        -H "Cookie: next-auth.session-token=${SESSION_TOKEN}" \
        -d "{\"documentId\": \"$doc_id\"}" \
        > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo "    ✅ Queued for processing"
    else
        echo "    ❌ Failed to queue"
    fi
}

# Get list of unprocessed documents
echo "🔍 Fetching unprocessed documents..."
DOCS_RESPONSE=$(curl -s -X GET http://localhost:3010/api/documents/process \
    -H "Cookie: next-auth.session-token=${SESSION_TOKEN}")

# Extract document IDs using jq or grep
if command -v jq &> /dev/null; then
    DOC_IDS=$(echo "$DOCS_RESPONSE" | jq -r '.documents[].id')
    DOC_COUNT=$(echo "$DOCS_RESPONSE" | jq '.count')
else
    echo "⚠️  jq not found, using grep fallback"
    DOC_IDS=$(echo "$DOCS_RESPONSE" | grep -oP '"id":"\K[^"]+')
    DOC_COUNT=$(echo "$DOC_IDS" | wc -l)
fi

echo "📊 Found $DOC_COUNT unprocessed documents"

if [ -z "$DOC_IDS" ]; then
    echo "✨ No unprocessed documents found!"
    exit 0
fi

# Process each document
echo "🚀 Starting document processing..."
for doc_id in $DOC_IDS; do
    process_document "$doc_id"
    # Add a small delay to avoid overwhelming the server
    sleep 0.5
done

echo "✅ All documents queued for processing!"
echo "📝 Check the application logs to monitor processing progress"