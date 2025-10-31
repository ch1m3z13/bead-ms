#!/bin/bash

# BeadApp E2E Test Script
# Tests the complete flow: Create Project → Scrape → Generate Posts

set -e

API_URL="http://localhost:3000"
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  BeadApp E2E Test Script              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Health Check
echo -e "${YELLOW}[1/5] Checking API health...${NC}"
HEALTH=$(curl -s $API_URL/health)
if echo "$HEALTH" | grep -q "ok"; then
    echo -e "${GREEN}✓ API is healthy${NC}"
    echo "$HEALTH" | jq '.'
else
    echo -e "${RED}✗ API health check failed${NC}"
    exit 1
fi
echo ""

# Step 2: Create Project
echo -e "${YELLOW}[2/5] Creating test project...${NC}"
PROJECT_DATA='{
  "name": "TestProject_'$(date +%s)'",
  "description": "E2E test project",
  "twitter_handle": "@testproject",
  "farcaster_channel": "testproject"
}'

PROJECT_RESPONSE=$(curl -s -X POST $API_URL/api/projects \
  -H "Content-Type: application/json" \
  -d "$PROJECT_DATA")

PROJECT_ID=$(echo "$PROJECT_RESPONSE" | jq -r '.id')

if [ "$PROJECT_ID" != "null" ] && [ -n "$PROJECT_ID" ]; then
    echo -e "${GREEN}✓ Project created: $PROJECT_ID${NC}"
    echo "$PROJECT_RESPONSE" | jq '.'
else
    echo -e "${RED}✗ Project creation failed${NC}"
    echo "$PROJECT_RESPONSE"
    exit 1
fi
echo ""

# Step 3: Wait for Processing
echo -e "${YELLOW}[3/5] Waiting for scraping and post generation...${NC}"
echo "   This takes ~5-10 seconds..."
for i in {1..10}; do
    echo -n "."
    sleep 1
done
echo ""
echo -e "${GREEN}✓ Processing time complete${NC}"
echo ""

# Step 4: Check for Insights
echo -e "${YELLOW}[4/5] Checking for insights...${NC}"
PROJECT_DETAILS=$(curl -s $API_URL/api/projects/$PROJECT_ID)
INSIGHTS_COUNT=$(echo "$PROJECT_DETAILS" | jq '.insights | length')

if [ "$INSIGHTS_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Found $INSIGHTS_COUNT insights${NC}"
    echo "$PROJECT_DETAILS" | jq '.insights[0]'
else
    echo -e "${RED}✗ No insights found (scraper may still be running)${NC}"
fi
echo ""

# Step 5: Check for Posts
echo -e "${YELLOW}[5/5] Checking for generated posts...${NC}"
POSTS_COUNT=$(echo "$PROJECT_DETAILS" | jq '.posts | length')

if [ "$POSTS_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Found $POSTS_COUNT posts${NC}"
    echo ""
    echo -e "${BLUE}Generated Post:${NC}"
    echo "$PROJECT_DETAILS" | jq -r '.posts[0].content' | head -c 200
    echo "..."
else
    echo -e "${RED}✗ No posts found (postgen may still be running)${NC}"
    echo "   Try running: curl $API_URL/api/projects/$PROJECT_ID | jq '.posts'"
fi
echo ""

# Summary
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Test Complete!                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "Project ID: ${GREEN}$PROJECT_ID${NC}"
echo -e "Insights: ${GREEN}$INSIGHTS_COUNT${NC}"
echo -e "Posts: ${GREEN}$POSTS_COUNT${NC}"
echo ""
echo -e "View full details:"
echo -e "  curl $API_URL/api/projects/$PROJECT_ID | jq '.'"
echo ""
echo -e "Monitor queues:"
echo -e "  http://localhost:3001"
echo ""