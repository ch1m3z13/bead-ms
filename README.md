# BeadApp Microservices

Event-driven microservices architecture for BeadApp - automatically scrape project updates and generate witty social media posts.

## 🏗️ Architecture

```
┌─────────────┐
│  Frontend   │
└──────┬──────┘
       │ HTTP
       ↓
┌─────────────┐      ┌──────────┐
│  Core API   │─────→│  Redis   │
└─────────────┘      └────┬─────┘
                          │
                          │ Queue: scrape-project
                          ↓
                   ┌──────────────────┐
                   │ Scraper Service  │
                   └────────┬─────────┘
                            │
                            │ Queue: generate-posts
                            ↓
                   ┌──────────────────┐
                   │ PostGen Service  │
                   └──────────────────┘
                            │
                            ↓
                   ┌──────────────────┐
                   │   Supabase DB    │
                   └──────────────────┘
```

## 📦 Services

| Service | Description | Port | Type |
|---------|-------------|------|------|
| **core-api** | REST API for CRUD operations | 3000 | HTTP Server |
| **scraper-service** | Fetches insights from social platforms | - | Worker |
| **postgen-service** | Generates posts from insights | - | Worker |
| **shared** | Common types, DB, and queue utilities | - | Library |

## 🚀 Quick Start

### Option 1: Using Make (Recommended)

```bash
# Install dependencies and build
make setup

# Start Redis
make redis-up

# In separate terminals, start each service:
make logs-api       # Terminal 1
make logs-scraper   # Terminal 2
make logs-postgen   # Terminal 3

# Run E2E test
make test
```

### Option 2: Manual Setup

See [SETUP.md](SETUP.md) for detailed instructions.

## 🧪 Testing

```bash
# Automated E2E test
make test

# Or manually:
chmod +x test-flow.sh
./test-flow.sh

# Create a project manually:
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MyProject",
    "twitter_handle": "@myproject"
  }'

# Check results (replace PROJECT_ID):
curl http://localhost:3000/api/projects/<PROJECT_ID> | jq '.'
```

## 📊 Monitoring

- **API Health**: http://localhost:3000/health
- **Queue Dashboard**: http://localhost:3001 (Bull Board)
- **Logs**: Check terminal outputs for each service

## 🛠️ Development

```bash
# Install dependencies
make install

# Build shared package
cd services/shared && npm run build

# Run services in dev mode (auto-reload)
cd services/core-api && npm run dev
cd services/scraper-service && npm run dev
cd services/postgen-service && npm run dev
```

## 📁 Project Structure

```
bead/
├── services/
│   ├── shared/              # Shared types, utilities
│   │   ├── src/
│   │   │   ├── types.ts     # TypeScript interfaces
│   │   │   ├── queue.ts     # Queue utilities
│   │   │   └── supabase.ts  # DB client
│   │   └── package.json
│   │
│   ├── core-api/            # REST API
│   │   ├── src/
│   │   │   └── index.ts     # Express server
│   │   └── package.json
│   │
│   ├── scraper-service/     # Scraping worker
│   │   ├── src/
│   │   │   └── index.ts     # BullMQ worker
│   │   └── package.json
│   │
│   └── postgen-service/     # Post generation worker
│       ├── src/
│       │   └── index.ts     # BullMQ worker
│       └── package.json
│
├── docker-compose.yml       # Redis + Bull Board
├── Makefile                 # Convenient commands
├── test-flow.sh            # E2E test script
├── SETUP.md                # Detailed setup guide
└── README.md               # This file
```

## 🔄 Data Flow

1. **User creates project** → Core API saves to DB
2. **Core API** → Enqueues scraping job
3. **Scraper Service** → Fetches insights (mock for now)
4. **Scraper Service** → Saves insights to DB
5. **Scraper Service** → Enqueues post generation job
6. **PostGen Service** → Generates posts (mock for now)
7. **PostGen Service** → Saves posts to DB
8. **Frontend** → Polls or subscribes to DB changes

## 🔧 Configuration

Each service needs a `.env` file:

```bash
# Required for all services
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
REDIS_HOST=localhost
REDIS_PORT=6379

# Optional for Core API
PORT=3000
```

See [SETUP.md](SETUP.md) for database schema and detailed configuration.

## 📝 Current Status

- ✅ Core API with project CRUD
- ✅ Queue-based job processing
- ✅ Mock scraper (Twitter + Farcaster)
- ✅ Mock post generation
- ✅ E2E test script
- ⏳ Real API integrations (next step)
- ⏳ Real LLM for post generation (next step)
- ⏳ Frontend integration (next step)

## 🎯 Next Steps

1. **Integrate Real APIs**
   - Add Twitter API v2 integration
   - Add Neynar for Farcaster
   - Add rate limiting

2. **Add Real LLM**
   - OpenAI integration
   - Prompt engineering for witty posts
   - Multiple post styles

3. **Production Ready**
   - Add authentication
   - Error tracking (Sentry)
   - Logging (Winston)
   - Monitoring (Prometheus)
   - Deployment (Railway/Render)

4. **Frontend**
   - Connect to Core API
   - Real-time updates via Supabase
   - Queue status display

## 🐛 Troubleshooting

See [SETUP.md](SETUP.md) for detailed troubleshooting steps.

Common issues:
- **Redis not connecting**: Run `docker-compose up -d`
- **Jobs not processing**: Check worker logs
- **Supabase errors**: Verify .env files

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test with `make test`
4. Submit PR

## 📄 License

MIT

---

Built with ❤️ for BeadApp