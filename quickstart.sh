#!/bin/bash

# BeadApp Quick Start Script
# Sets up the entire microservices architecture

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}"
cat << "EOF"
╔══════════════════════════════════════════╗
║  BeadApp Microservices Quick Start      ║
╚══════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"
command -v node >/dev/null 2>&1 || { echo "Node.js is required but not installed."; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Docker is required but not installed."; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "Docker Compose is required but not installed."; exit 1; }
echo -e "${GREEN}✓ All prerequisites met${NC}\n"

# Check for .env files
echo -e "${YELLOW}Checking environment configuration...${NC}"
MISSING_ENV=0

for service in "core-api" "scraper-service" "postgen-service"; do
    if [ ! -f "services/$service/.env" ]; then
        echo -e "${YELLOW}⚠ Missing: services/$service/.env${NC}"
        MISSING_ENV=1
    fi
done

if [ $MISSING_ENV -eq 1 ]; then
    echo ""
    echo -e "${YELLOW}Please create .env files using the template:${NC}"
    echo "cp .env.example services/core-api/.env"
    echo "cp .env.example services/scraper-service/.env"
    echo "cp .env.example services/postgen-service/.env"
    echo ""
    echo "Then update with your Supabase credentials."
    read -p "Press enter once you've created the .env files..."
fi

echo -e "${GREEN}✓ Environment configured${NC}\n"

# Install dependencies
echo -e "${YELLOW}[1/4] Installing dependencies...${NC}"
cd services/shared && npm install && npm run build
cd ../core-api && npm install
cd ../scraper-service && npm install
cd ../postgen-service && npm install
cd ../../
echo -e "${GREEN}✓ Dependencies installed${NC}\n"

# Start Redis
echo -e "${YELLOW}[2/4] Starting Redis...${NC}"
docker-compose up -d
sleep 3
echo -e "${GREEN}✓ Redis started${NC}\n"

# Check database
echo -e "${YELLOW}[3/4] Checking database setup...${NC}"
echo "Please ensure you've created the Supabase tables."
echo "SQL schema is in SETUP.md"
read -p "Press enter if tables are created, or Ctrl+C to exit and set up database..."
echo -e "${GREEN}✓ Database ready${NC}\n"

# All set!
echo -e "${YELLOW}[4/4] Setup complete!${NC}\n"

echo -e "${GREEN}"
cat << "EOF"
╔══════════════════════════════════════════╗
║  🎉 Setup Complete!                     ║
╚══════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo "Start the services in separate terminals:"
echo ""
echo -e "${BLUE}Terminal 1:${NC} cd services/core-api && npm run dev"
echo -e "${BLUE}Terminal 2:${NC} cd services/scraper-service && npm run dev"
echo -e "${BLUE}Terminal 3:${NC} cd services/postgen-service && npm run dev"
echo ""
echo "Or use tmux:"
echo -e "${BLUE}make dev${NC}"
echo ""
echo "Then test the flow:"
echo -e "${BLUE}./test-flow.sh${NC}"
echo ""
echo "Monitor queues at: ${GREEN}http://localhost:3001${NC}"
echo "API health check: ${GREEN}http://localhost:3000/health${NC}"
echo ""
echo "Happy coding! 🚀"