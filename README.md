# Bead — Microservices Scaffold (Vercel / OpenAI / Upstash Redis)

This scaffold splits the Bead Mini App into three microservices plus shared utilities:

- `core-api/` — orchestrator (watchlist CRUD, triggers scrapes)
- `scraper-service/` — fetches project updates from X (Twitter) / Farcaster
- `postgen-service/` — generates 3 witty Farcaster-style posts using OpenAI
- `shared/` — shared clients (queue, supabase helpers), types
- `apps/frontend/` — placeholder for your Next.js mini app (keep your existing app here)

Features:
- Designed for deployment on **Vercel Functions**
- Post generation uses **OpenAI (gpt-4o-mini)** by default
- Pub/sub via **Upstash Redis** (serverless Redis)

## Quickstart (development)

1. Copy `.env.example` to `.env` and fill values (OpenAI key, Upstash Redis URL, Supabase).
2. Start local Redis (optional) or use Upstash for dev.
3. Run services individually:
   - `cd services/core-api && npm install && npm run dev`
   - `cd services/scraper-service && npm install && npm run dev`
   - `cd services/postgen-service && npm install && npm run dev`

## Deploying to Vercel

Each service can be deployed as a separate Vercel project or monorepo with separate `vercel.json` routes.

See each service's `vercel.json` stub for function settings.

## License

MIT
