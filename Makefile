.PHONY: help install build dev clean test

help: ## Show this help message
	@echo "BeadApp Microservices Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: ## Install all dependencies
	@echo "📦 Installing dependencies..."
	cd services/shared && npm install
	cd services/core-api && npm install
	cd services/scraper-service && npm install
	cd services/postgen-service && npm install
	@echo "✅ All dependencies installed!"

build: ## Build all services
	@echo "🔨 Building services..."
	cd services/shared && npm run build
	@echo "✅ Build complete!"

dev: ## Start all services in development mode (requires tmux)
	@echo "🚀 Starting all services..."
	@command -v tmux >/dev/null 2>&1 || { echo "tmux is required but not installed. Install with: brew install tmux (macOS) or apt-get install tmux (Linux)"; exit 1; }
	tmux new-session -d -s bead 'docker-compose up'
	tmux split-window -h -t bead 'cd services/core-api && npm run dev'
	tmux split-window -v -t bead 'cd services/scraper-service && npm run dev'
	tmux split-window -v -t bead 'cd services/postgen-service && npm run dev'
	tmux select-layout -t bead tiled
	tmux attach -t bead

dev-simple: ## Start services one by one (no tmux required)
	@echo "Starting services..."
	@echo "1. Start Redis: docker-compose up"
	@echo "2. Start Core API: cd services/core-api && npm run dev"
	@echo "3. Start Scraper: cd services/scraper-service && npm run dev"
	@echo "4. Start PostGen: cd services/postgen-service && npm run dev"

redis-up: ## Start Redis
	docker-compose up -d

redis-down: ## Stop Redis
	docker-compose down

redis-logs: ## View Redis logs
	docker-compose logs -f redis

test: ## Run end-to-end test
	@chmod +x test-flow.sh
	@./test-flow.sh

clean: ## Clean all node_modules and dist folders
	@echo "🧹 Cleaning..."
	rm -rf services/shared/node_modules services/shared/dist
	rm -rf services/core-api/node_modules services/core-api/dist
	rm -rf services/scraper-service/node_modules services/scraper-service/dist
	rm -rf services/postgen-service/node_modules services/postgen-service/dist
	@echo "✅ Clean complete!"

setup: install build ## Full setup (install + build)
	@echo "✅ Setup complete! Run 'make dev' to start services"

logs-api: ## Tail Core API logs
	cd services/core-api && npm run dev

logs-scraper: ## Tail Scraper logs
	cd services/scraper-service && npm run dev

logs-postgen: ## Tail PostGen logs
	cd services/postgen-service && npm run dev

health: ## Check API health
	@curl -s http://localhost:3000/health | jq '.'

queues: ## Open Bull Board (queue monitor)
	@open http://localhost:3001 || xdg-open http://localhost:3001 || echo "Queue monitor: http://localhost:3001"