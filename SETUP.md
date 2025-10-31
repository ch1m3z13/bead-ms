# BeadApp Microservices Setup Guide

## 🚀 Quick Start (5 minutes)

### Prerequisites
- Node.js 18+ installed
- Docker and Docker Compose installed
- Supabase account (free tier is fine)

### 1. Database Setup

Create these tables in your Supabase project:

```sql
-- Projects table
create table projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  twitter_handle text,
  farcaster_channel text,
  user_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insights table
create table insights (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  source text not null check (source in ('twitter', 'farcaster', 'manual')),
  content text not null,
  url text,
  author text,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Posts table
create table posts (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  insight_ids uuid[] not null,
  content text not null,
  tone text not null check (tone in ('witty', 'serious', 'hype', 'educational')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  published_at timestamp with time zone
);

-- Indexes for performance
create index insights_project_id_idx on insights(project_id);
create index posts_project_id_idx on posts(project_id);
```

### 2. Environment Variables

Create `.env` files in each service:

**services/core-api/.env**
```bash
PORT=3000
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
REDIS_HOST=localhost
REDIS_PORT=6379
```

**services/scraper-service/.env**
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
REDIS_HOST=localhost
REDIS_PORT=6379
```

**services/postgen-service/.env**
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 3. Install and Build

```bash
# From project root
cd services/shared
npm install
npm run build

cd ../core-api
npm install

cd ../scraper-service
npm install

cd ../postgen-service
npm install

cd ../../
```

### 4. Start Services

Open **4 terminal windows**:

**Terminal 1: Redis**
```bash
docker-compose up
```

**Terminal 2: Core API**
```bash
cd services/core-api
npm run dev
```

**Terminal 3: Scraper Service**
```bash
cd services/scraper-service
npm run dev
```

**Terminal 4: Post Generation Service**
```bash
cd services/postgen-service
npm run dev
```

---

## 🧪 Testing the Flow

### Test 1: Health Checks

```bash
# Check Core API
curl http://localhost:3000/health

# Should return:
# {
#   "status": "ok",
#   "service": "core-api",
#   "redis": "connected",
#   "timestamp": "..."
# }
```

### Test 2: Create a Project

```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "BasedPunks",
    "description": "NFT collection on Base",
    "twitter_handle": "@basedpunks",
    "farcaster_channel": "basedpunks"
  }'
```

**What happens:**
1. ✅ Core API creates the project
2. 📤 Job is enqueued to `scrape-project` queue
3. 🔍 Scraper picks it up (check Terminal 3!)
4. 💾 Mock insights are stored in DB
5. 📤 Job is enqueued to `generate-posts` queue
6. ✨ PostGen picks it up (check Terminal 4!)
7. 📝 Posts are generated and stored

### Test 3: View the Results

```bash
# Get the project ID from the previous response, then:
curl http://localhost:3000/api/projects/<PROJECT_ID>

# You should see:
# {
#   "id": "...",
#   "name": "BasedPunks",
#   "insights": [...],  # 5 mock insights
#   "posts": [...]      # 1-2 generated posts
# }
```

### Test 4: Monitor the Queue (Optional)

Visit http://localhost:3001 to see Bull Board - a UI for monitoring your queues!

---

## 📊 Expected Output

When everything works, you'll see:

**Terminal 1 (Redis):**
```
redis_1  | Ready to accept connections
```

**Terminal 2 (Core API):**
```
🚀 Core API running on http://localhost:3000
📊 Redis: ✅ Connected

✅ Project created: abc-123-def
📤 Enqueued scraping job for project abc-123-def
```

**Terminal 3 (Scraper):**
```
🔍 Scraper Service Started
📊 Listening to queue: scrape-project

🔍 Starting scrape job for project abc-123-def...
   Project: BasedPunks
   📱 Fetching Twitter insights (mock)...
   🎩 Fetching Farcaster insights (mock)...
   ✅ Stored 5 insights
   📤 Enqueued post generation job
✅ Job 1 completed successfully
```

**Terminal 4 (PostGen):**
```
✨ Post Generation Service Started
📊 Listening to queue: generate-posts

✨ Starting post generation for project abc-123-def...
   Project: BasedPunks
   Insights: 5
   ✅ Generated 2 posts
   📝 Post 1 [witty]: BasedPunks is cooking and the community knows it...
   📝 Post 2 [hype]: 🚀 BasedPunks SEASON IS HERE 🚀...
✅ Job 1 completed successfully
```

---

## 🐛 Troubleshooting

### Redis Connection Failed
```bash
# Check if Redis is running
docker-compose ps

# Restart if needed
docker-compose down
docker-compose up -d
```

### Services Can't Connect to Supabase
- Double-check your `.env` files
- Make sure SUPABASE_URL includes `https://`
- Use the SERVICE_KEY, not the ANON_KEY

### Jobs Not Processing
- Check if all services are running
- Look for errors in the terminal logs
- Visit http://localhost:3001 to see queue status

### TypeScript Errors
```bash
# Rebuild shared package
cd services/shared
npm run build

# Check if services can find @bead/shared
cd ../core-api
npm install
```

---

## 🎯 Next Steps

Now that the basic flow works, you can:

1. **Add Real LLM**: Replace mock post generation with OpenAI/Anthropic
2. **Add Real Scrapers**: Integrate Twitter API, Neynar for Farcaster
3. **Add Authentication**: Implement Farcaster auth in Core API
4. **Add Frontend**: Connect your Next.js app to Core API
5. **Add Monitoring**: Set up logging, error tracking
6. **Add Retries**: Configure retry strategies for failed jobs
7. **Add Rate Limiting**: Prevent hitting API limits

---

## 📁 Project Structure

```
bead/
├── services/
│   ├── shared/              # Types, DB, Queue utils
│   ├── core-api/            # REST API (Port 3000)
│   ├── scraper-service/     # Worker (no HTTP)
│   └── postgen-service/     # Worker (no HTTP)
├── docker-compose.yml       # Redis + Bull Board
└── SETUP.md                 # This file!
```

---

## 🎓 Understanding the Flow

```
1. User creates project
   ↓ (HTTP POST)
   
2. Core API
   - Saves to DB
   - Enqueues "scrape-project" job
   ↓ (Redis Queue)
   
3. Scraper Service
   - Fetches insights (mock for now)
   - Saves insights to DB
   - Enqueues "generate-posts" job
   ↓ (Redis Queue)
   
4. PostGen Service
   - Reads insights from DB
   - Generates posts (mock for now)
   - Saves posts to DB
   ↓ (Supabase Realtime)
   
5. Frontend
   - Subscribes to DB changes
   - Updates UI automatically
```

---

## 🔥 Pro Tips

1. **Use Bull Board**: It's running on port 3001 - great for debugging queues
2. **Check Terminal Logs**: Each service logs what it's doing
3. **Start Small**: Test with one project first
4. **Watch the Database**: Use Supabase Table Editor to see data flow
5. **Mock Everything**: Don't integrate real APIs until basic flow works

---

Happy hacking! 🚀