# thecueRoom V2 - Project Memory

## Project Overview

**Goal**: Complete V2 rebuild of thecueRoom as a production-grade monorepo application migrating from Firebase to Supabase+Drizzle ORM with modern UI/UX and advanced features.

**Status**: ✅ Foundation Complete - Feature Development In Progress

**Timeline**: Multi-stage project (26 tasks total)

## Current State (Oct 27, 2025)

### ✅ Completed (9/26 tasks)
1. **Monorepo Architecture**: pnpm workspace with apps/web, packages (db, ai-adapters, shared)
2. **V1 Branding Preserved**: Logo, color scheme (#0B0B0B, #D7FF3C lime, #9B5CFF purple), Inter font
3. **Supabase Integration**: Client setup and configuration ready
4. **Database Schema**: Comprehensive Drizzle ORM schema (users, profiles, feeds, sources, spotlights, gigs, forum, EPKs, AI jobs)
5. **60+ News Sources**: Worldwide coverage across Scene, Industry, Gear, Regional, Features, EDM, Community categories
6. **Feed API**: Endpoints for feeds and sources with pagination and caching
7. **AI Adapters**: OpenAI integration with local fallback generator
8. **Landing Page**: Modern hero section with V1 branding
9. **Development Server**: Running successfully on port 5000 ✓

### 🔨 In Progress (1/26 tasks)
- **UI Components Library**: Building modern components with V1 branding

### ⏳ Pending (16/26 tasks)
Core features to build:
- Feed ingestion worker (RSS/JSON parsing, deduplication, thumbnails)
- AI Cover Art Studio, EPK Generator, Meme Generator, Avatar Generator
- Community Forum with threads, comments, upvotes
- Gig Radar with map view and calendar
- Weekly Curated Music playlists
- Admin Console with secure authentication
- Authentication system with admin role
- Profile management
- Docker setup, CI/CD, performance optimization
- Final testing and security audit

## Technical Architecture

### Stack
- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS
- **Backend**: Next.js API routes, Drizzle ORM
- **Database**: PostgreSQL via Supabase
- **AI**: OpenAI DALL-E, local Canvas fallback
- **Package Manager**: pnpm workspaces
- **Deployment**: Replit (dev), production TBD

### Project Structure
```
thecueroom-v2/
├── apps/web/              # Next.js application
│   ├── app/              # Pages and API routes
│   ├── components/       # React components
│   └── lib/              # Utilities and clients
├── packages/
│   ├── db/               # Drizzle schema & migrations
│   ├── ai-adapters/      # AI service adapters
│   └── shared/           # Shared types & utils
└── data/sources.json     # 60+ news feed sources
```

## User Preferences

### Design Requirements
- **MUST preserve V1 branding**: Logo, colors (#0B0B0B, #D7FF3C, #9B5CFF), Inter font
- **Advanced modern UI/UX**: Production-grade, fast, responsive
- **Feed requirements**: Title, summary, thumbnails, external links, tags, FAST loading

### Admin Access
- **Email**: dejayillegal@gmail.com
- **Note**: Admin credentials should be moved to environment variables for security

### Feature Priorities
1. **Worldwide Music News Feeds** - Global coverage with fast loading
2. **AI Creative Tools** - Cover Art, EPK, Meme, Avatar generators
3. **Community Features** - Forum, Gig Radar, Weekly Playlists
4. **Admin Console** - Content management and moderation

## Recent Changes (Oct 28, 2025)

### Database & Seeding (Oct 28, 2025)
- ✅ Database tables successfully created via Drizzle migrations
- ✅ Admin seeding script created (`scripts/seed-admin.ts`)
- ✅ Setup script created for one-command initialization
- ✅ Admin user created: dejayillegal@gmail.com with secure bcrypt password hash
- ✅ Admin profile created with 1000 AI credits
- ✅ Environment variables documented in .env.example
- ✅ Feed ingestion integrated into setup - automatically fetches 167+ news items on initialization
- ✅ News sources seeded from data/sources.json (60+ worldwide sources)

### UI Updates (Oct 28, 2025)
- ✅ Dashboard UI updated to match pixel-perfect reference image
- ✅ Transparent header with purple/green gradient on left
- ✅ Sidebar styling refined with proper spacing and yellow active state
- ✅ Dashboard cards updated with consistent styling using `dashboard-card` class
- ✅ All borders removed from header and cards for cleaner look

## Recent Changes (Oct 27, 2025)

### Architecture
- Created pnpm monorepo with 4 workspaces
- Set up Drizzle ORM with comprehensive schema (10+ tables)
- Configured Supabase client integration
- Implemented AI adapter pattern with fallback support

### Content
- Expanded from V1 to 60+ worldwide news sources
- Categories: Scene, Industry, Gear, Regional, Features, EDM, Community

### API
- Created `/api/feeds` - Feed listing with pagination and caching
- Created `/api/sources` - Source management
- Implemented cursor-based pagination for performance

### UI
- Built landing page with animated logo
- Preserved V1 dark theme with lime/purple accents
- Created feeds page structure (content TBD)

### Documentation
- README.md - Quick start and project overview
- DEVELOPER_GUIDE.md - Architecture and development guide

## Important Notes

### Security
✅ **COMPLETED**: Admin credentials are now properly configured via environment variables:
```bash
ADMIN_EMAIL=dejayillegal@gmail.com
ADMIN_PASSWORD=Closer@82
```
- Password is securely hashed using bcrypt during seeding
- Admin user is automatically created with `pnpm seed:admin` or `pnpm setup`
- Admin has 1000 AI credits by default (vs 100 for regular users)

### Database
- Schema defined in `packages/db/schema.ts`
- Migrations not yet run (awaiting Supabase database setup)
- All tables use UUID primary keys
- Comprehensive relations defined

### AI Services
- OpenAI adapter requires `OPENAI_API_KEY` env variable
- Local fallback works without API keys (canvas-based generation)
- Adapter factory auto-selects best available option

## Next Steps

### Immediate (Task 8)
- Build UI components library with V1 branding
- Create reusable components: Button, Card, Input, Modal, etc.
- Implement dark theme with design tokens

### High Priority
1. **Feed Ingestion Worker** (Task 6) - Parse RSS, deduplicate, extract thumbnails
2. **Authentication System** (Task 21) - Supabase Auth with admin role
3. **Admin Console** (Task 17) - Secure content management
4. **AI Cover Art Studio** (Task 10) - First AI feature to ship

### Medium Priority
- Community Forum (Task 14)
- Gig Radar (Task 15)
- AI EPK Generator (Task 11)
- Profile Management (Task 22)

### Low Priority
- Docker setup (Task 19)
- CI/CD (Task 23)
- Performance optimization (Task 25)
- Final testing (Task 26)

## Development Commands

```bash
# Start dev server (already running)
pnpm dev

# Install new package
pnpm --filter web add <package>
pnpm --filter db add <package>

# Database migrations
pnpm migrate:generate
pnpm migrate

# Build for production
pnpm build
```

## Environment Variables Required

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# AI Services (Optional)
OPENAI_API_KEY=
REPLICATE_API_KEY=

# Admin (Secure)
ADMIN_EMAIL=dejayillegal@gmail.com
ADMIN_PASSWORD_HASH=[bcrypt hash]

# App
NEXT_PUBLIC_APP_URL=http://localhost:5000
```

## Known Issues

1. **Database not provisioned yet** - Schema ready, awaiting Supabase setup
2. **Feed worker not built** - Feeds API exists but no content ingestion yet
3. **Auth not implemented** - Admin access requires authentication system
4. **UI components incomplete** - Need complete component library

## Success Metrics

- [x] Monorepo structure established
- [x] V1 branding preserved
- [x] 60+ news sources configured
- [x] Development server running
- [ ] First feed successfully ingested
- [ ] Admin can log in and manage content
- [ ] AI Cover Art generator functional
- [ ] Community features live
- [ ] Production deployment ready

---

Last updated: October 27, 2025
Project Lead: dejayillegal@gmail.com
