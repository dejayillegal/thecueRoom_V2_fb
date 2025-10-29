.PHONY: dev build test ci lint typecheck migrate seed diag clean help

help:
	@echo "thecueRoom V2 - Development Commands"
	@echo ""
	@echo "  make dev         - Start development server and worker"
	@echo "  make build       - Build all packages"
	@echo "  make test        - Run all tests"
	@echo "  make ci          - Run CI checks (typecheck + test)"
	@echo "  make lint        - Run linters"
	@echo "  make typecheck   - Run TypeScript type checking"
	@echo "  make migrate     - Run database migrations"
	@echo "  make seed        - Seed database with initial data"
	@echo "  make diag        - Run diagnostic scripts"
	@echo "  make clean       - Clean build artifacts"

dev:
	@echo "Starting development environment..."
	pnpm dev

build:
	pnpm build

test:
	pnpm test

ci: typecheck test
	@echo "CI checks passed!"

lint:
	pnpm lint

typecheck:
	pnpm typecheck

migrate:
	pnpm migrate

seed: migrate
	pnpm seed:sources
	pnpm seed:admin

diag:
	@echo "Running diagnostic checks..."
	@echo "\n=== CSS Heavy Check ==="
	node scripts/diag/check-heavy-css.js
	@echo "\n=== Memory Check ==="
	node scripts/diag/check-memory.js
	@echo "\n=== Scroll Stress Test ==="
	node scripts/diag/run-scroll-stress.js http://localhost:5000/feed || echo "Server must be running"

clean:
	pnpm clean
	rm -rf node_modules/.cache
	rm -rf apps/web/.next
	find . -name "*.tsbuildinfo" -delete
