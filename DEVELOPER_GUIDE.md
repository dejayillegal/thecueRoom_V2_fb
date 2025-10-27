# Developer Guide - thecueRoom V2

## Architecture Overview

thecueRoom V2 is built as a modern monorepo using:
- **pnpm workspaces** for package management
- **Next.js 15** (App Router) for the web application
- **Drizzle ORM** with PostgreSQL (Supabase)
- **TypeScript** strict mode throughout

## Monorepo Structure

### apps/web
Next.js application with App Router structure:
- `/app` - Pages and API routes
- `/components` - React components
- `/lib` - Utility functions and clients

### packages/db
Database layer with Drizzle ORM:
- `schema.ts` - Database schema definitions
- `zodSchemas.ts` - Runtime validation schemas
- `migrations/` - Database migrations

### packages/ai-adapters
AI service adapters with fallback support:
- `openai-adapter.ts` - OpenAI DALL-E integration
- `local-fallback-adapter.ts` - Canvas-based generator
- `adapter-factory.ts` - Automatic adapter selection

### packages/shared
Shared types and utilities:
- `types.ts` - TypeScript type definitions
- `utils.ts` - Common utility functions

## Database Schema

### Core Tables
- `users` - User accounts
- `profiles` - User profiles and preferences
- `sources` - News feed sources
- `feeds` - Aggregated news items
- `spotlight_items` - Featured content
- `playlists` - Weekly curated playlists

### Community Tables
- `forum_threads` - Forum discussions
- `forum_comments` - Thread comments
- `gigs` - Event listings
- `memes` - User-generated memes

### AI & Content Tables
- `ai_jobs` - AI generation job queue
- `epks` - Electronic press kits
- `assets` - File storage metadata

## Adding News Sources

Edit `data/sources.json`:

```json
{
  "name": "Your Source",
  "kind": "rss",
  "url": "https://example.com/feed.xml",
  "tags": ["scene", "techno"],
  "category": "scene"
}
```

Supported kinds:
- `rss` - Standard RSS/Atom feeds
- `scrape` - Custom web scraping (advanced)

## API Development

### Creating New Endpoints

API routes in Next.js 15 App Router:

```typescript
// apps/web/app/api/your-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Your logic here
  return NextResponse.json({ data: [] });
}
```

### Database Queries

Use Drizzle ORM for type-safe queries:

```typescript
import { getDbClient } from '@/lib/db-client';
import { feeds } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';

const db = getDbClient();
const results = await db.select().from(feeds).where(eq(feeds.id, id));
```

## AI Adapters

The platform uses an adapter pattern for AI services:

```typescript
import { getAdapter } from '@thecueroom/ai-adapters';

const adapter = getAdapter(); // Auto-selects OpenAI or local fallback
const result = await adapter.generateImage({ prompt: 'techno artwork' });
```

## Component Development

Follow these conventions:

1. **Server Components by default** - Use `'use client'` only when needed
2. **Tailwind CSS** - Use utility classes with the design tokens
3. **Accessibility** - Always include ARIA labels and keyboard support
4. **Responsive Design** - Mobile-first approach

## Branding & Design Tokens

CSS variables defined in `apps/web/app/globals.css`:

```css
:root {
  --background: 240 0% 4.3%;  /* #0B0B0B */
  --primary: 70 86% 51%;       /* #D7FF3C */
  --secondary: 265 100% 68%;   /* #9B5CFF */
}
```

Use with Tailwind:
```tsx
<div className="bg-background text-primary">
```

## Performance Optimization

### Feed Loading
- Server-side rendering for initial page
- Incremental loading with cursor-based pagination
- Aggressive caching with `Cache-Control` headers

### Image Optimization
- Next.js Image component for automatic optimization
- Remote patterns configured in `next.config.ts`
- Lazy loading for off-screen images

### Code Splitting
- Automatic with Next.js App Router
- Dynamic imports for heavy components
- Separate chunks for AI tools

## Testing

### Unit Tests
```bash
pnpm test
```

### Type Checking
```bash
pnpm typecheck
```

### Linting
```bash
pnpm lint
```

## Deployment

### Environment Setup
1. Set all required environment variables
2. Run database migrations
3. Build the application

### Production Build
```bash
pnpm build
pnpm start
```

### Database Migrations
```bash
# Generate migration from schema changes
pnpm migrate:generate

# Apply migrations
pnpm migrate
```

## Troubleshooting

### Common Issues

**Module not found errors**
```bash
pnpm install
```

**Database connection errors**
- Verify `DATABASE_URL` in `.env`
- Check Supabase project status

**Build failures**
- Clear `.next` directory
- Run `pnpm clean` and rebuild

## Best Practices

1. **Type Safety** - Use TypeScript strict mode, no `any` types
2. **Error Handling** - Always handle errors gracefully with user feedback
3. **Security** - Never expose secrets, use environment variables
4. **Code Quality** - Run lint and typecheck before committing
5. **Performance** - Optimize images, use caching, minimize bundle size

## Contributing

1. Create feature branch from `main`
2. Make changes following conventions
3. Run tests and type checking
4. Submit PR with clear description
