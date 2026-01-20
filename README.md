# thecueRoom V2

> Underground techno & house music community platform with AI creative tools, global news feeds, and community features.

## 🎵 Features

- **Global News Feeds**: 60+ worldwide sources covering Scene, Industry, Gear, Regional, Features, EDM, Community
- **AI Creative Suite**: Cover Art Generator, EPK Builder, Meme Creator, Avatar Studio
- **Community Hub**: Forum, Gig Radar, Weekly Playlists
- **Admin Console**: Content management and moderation
- **Modern UI**: Dark theme with lime (#D7FF3C) and purple (#9B5CFF) accents

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm 8+
- Supabase account (for database and auth)

### Platform-Agnostic Setup

1. **Environment Variables**:
   Copy `.env.example` to `.env` and fill in your credentials.
   ```bash
   cp .env.example .env
   ```

2. **Installation**:
   ```bash
   pnpm install
   ```

3. **Initialize Database**:
   ```bash
   pnpm setup
   ```

   The `pnpm setup` command is a one-step initialization that:
   - Validates your environment variables
   - Checks database connectivity
   - Runs all migrations
   - Seeds the admin user
   - Seeds news sources
   - Performs initial feed ingestion

4. **Development**:
   ```bash
   pnpm dev
   ```

The app will be available at http://localhost:5000

## 🗄️ Database Providers

See [docs/PROVIDERS.md](docs/PROVIDERS.md) for details on switching between Supabase and Neon.

## 🚀 Deployment Matrix (Free Tiers Only)

| Platform | Database | Ingestion | Notes |
| :--- | :--- | :--- | :--- |
| **Local** | Supabase / Neon | Internal Scheduler | [Guide](docs/INGESTION_SCHEDULER.md) |
| **Vercel** | Supabase / Neon | Internal Scheduler | [Guide](docs/INGESTION_SCHEDULER.md) |
| **Railway** | Supabase / Neon | Internal Scheduler | [Guide](docs/INGESTION_SCHEDULER.md) |
| **Fly.io** | Supabase / Neon | Internal Scheduler | [Guide](docs/INGESTION_SCHEDULER.md) |
| **VPS** | Supabase / Neon | Internal Scheduler | [Guide](docs/INGESTION_SCHEDULER.md) |

## 🛡️ Production Security Checklist

- [ ] Change `ADMIN_PASSWORD` from default.
- [ ] Use `NODE_ENV=production`.
- [ ] Ensure `DATABASE_URL` is using a private/internal network where possible.
- [ ] Disable `TEST_MODE`.
- [ ] Monitor Ingestion Status in Admin Console.

## 📁 Project Structure

```
thecueroom-v2/
├── apps/
│   └── web/              # Next.js 15 application
├── packages/
│   ├── db/               # Drizzle ORM schema, migrations & scheduler
│   ├── ai-adapters/      # OpenAI & local fallback adapters
│   └── shared/           # Shared utilities and types
├── data/
│   └── sources.json      # News feed sources configuration
└── scripts/              # Build and ingestion scripts
```

## 🛠️ Development

```bash
# Development
pnpm dev                 # Start dev server

# Building
pnpm build              # Build all packages
pnpm start              # Production server

# Database
pnpm migrate            # Run migrations
pnpm migrate:generate   # Generate new migration

# Testing & Quality
pnpm lint               # Lint all packages
pnpm typecheck          # Type check
pnpm test               # Run tests
```

## 🔧 Configuration

### Environment Variables

See `.env.example` for all required variables:

- **Supabase**: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
- **AI Services** (Optional): OPENAI_API_KEY, REPLICATE_API_KEY
- **Admin**: ADMIN_EMAIL, ADMIN_PASSWORD_HASH

### News Sources

Edit `data/sources.json` to add/remove news sources. Supports:
- RSS feeds (most common)
- Web scraping (for sites without RSS)

## 🎨 Branding

- **Background**: #0B0B0B
- **Surface**: #111111
- **Primary (Lime)**: #D7FF3C
- **Secondary (Purple)**: #9B5CFF
- **Fonts**: Inter (UI), Source Code Pro (mono)

## 📄 License

All rights reserved © theCueRoom

## 🔄 Automated Feed Ingestion

thecueRoom V2 features an **Internal Background Scheduler** that automatically manages news feed ingestion within the application process.

### Features
- **No External Cron Required**: Runs entirely inside the Node process.
- **Admin Configurable**: Toggle status and adjust intervals (5 min - 24 hours) via the Admin Dashboard.
- **Fail-Safe**: Uses database-level locking to prevent duplicate runs across server restarts or multiple instances.
- **Diagnostics**: Real-time monitoring of last run, next scheduled run, and error logs in the Admin Console.

For more details on how the scheduler works and how to configure it, see [docs/INGESTION_SCHEDULER.md](docs/INGESTION_SCHEDULER.md).

### Manual Trigger
You can still run ingestion manually via the CLI if needed:
```bash
pnpm ingest
```

## Setup