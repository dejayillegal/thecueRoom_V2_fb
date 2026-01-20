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

## 🚀 Deployment Matrix

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
- [ ] Ensure `DATABASE_URL` is using a private/internal network.
- [ ] Disable `TEST_MODE`.
- [ ] Monitor Ingestion Status in Admin Console.

## 🔄 Automated Feed Ingestion

thecueRoom V2 features an **Internal Background Scheduler** that manages news feed ingestion within the application process.

### Features
- **Autonomous**: Runs entirely inside the Node process.
- **Admin Configurable**: Toggle status and adjust intervals (5 min - 24 hours) via the Admin Dashboard.
- **Safe**: Uses database-level locking to prevent duplicate runs.
- **Traceable**: Real-time status and error logs available in the Admin Console.

For technical details, see [docs/INGESTION_SCHEDULER.md](docs/INGESTION_SCHEDULER.md).

## 📁 Project Structure

```
thecueroom-v2/
├── apps/
│   └── web/              # Next.js 15 application
├── packages/
│   ├── db/               # Drizzle ORM schema, migrations & internal scheduler
│   ├── ai-adapters/      # OpenAI & local fallback adapters
│   └── shared/           # Shared utilities and types
├── data/
│   └── sources.json      # News feed sources configuration
└── scripts/              # Build and ingestion scripts
```

## 📄 License

All rights reserved © theCueRoom
