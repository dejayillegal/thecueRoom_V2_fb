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

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Run database migrations
pnpm migrate

# Start development server
pnpm dev
```

The app will be available at http://localhost:5000

## 📁 Project Structure

```
thecueroom-v2/
├── apps/
│   └── web/              # Next.js 15 application
├── packages/
│   ├── db/               # Drizzle ORM schema & migrations
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

## Automated Feed Ingestion

### Free Option: External Cron Service

For automatic feed ingestion without paying for Replit Scheduled Deployments:

1. **Set up CRON_SECRET**:
   ```bash
   # Add to Replit Secrets
   CRON_SECRET=your-super-secret-random-string-min-32-chars
   ```

2. **Test your endpoint**:
   ```bash
   CRON_SECRET=your-secret tsx scripts/test-cron-endpoint.ts
   ```

3. **Configure cron-job.org** (free):
   - Sign up at https://cron-job.org
   - Create job pointing to: `https://[your-repl].repl.co/api/cron/ingest`
   - Add header: `Authorization: Bearer YOUR_CRON_SECRET`
   - Set schedule: `0 * * * *` (every hour)

See [docs/EXTERNAL_CRON_SETUP.md](docs/EXTERNAL_CRON_SETUP.md) for detailed instructions.

## Setup