# thecueRoom V2 - Architectural Architecture & Feed Ingestion

## System Overview
thecueRoom V2 is a Next.js monorepo with a robust, automated backend for music news aggregation and community features.

## In-Process Ingestion Engine
To avoid external dependencies like cron jobs, the platform utilizes an **In-Process Scheduler**:

### 1. The Scheduler (`packages/db/scheduler.ts`)
- **Loop**: Runs every 60 seconds using `setInterval` within the server process.
- **Check**: Queries `feed_ingestion_config` to see if `nextRunAt` has passed.
- **Locking**: Uses an `isRunning` atomic lock in the database to prevent duplicate ingestion cycles in multi-instance environments.
- **First-Run**: Automatically triggers ingestion if the system detects no previous runs.

### 2. The Configuration (`packages/db/schema.ts`)
- **`feed_ingestion_config`**: Centralized table for scheduler state.
- **Interval**: Defaults to 60 minutes, configurable via database.

### 3. Initialization (`apps/web/lib/init-scheduler.ts`)
- **Hook**: Injected into `apps/web/app/layout.tsx` to ensure it starts exactly once when the server boots.
- **Environment Aware**: Only runs on the server side (`typeof window === 'undefined'`).

## Data Integrity
- **Deduplication**: SHA-256 content hashing of `title` + `link` ensures no duplicate entries.
- **Observability**: Every run is logged in `fetch_logs` with status, timing, and item counts.

## Environment Requirements
- **Runtime**: Node.js / Next.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Supabase Auth or custom JWT-based (as configured).
