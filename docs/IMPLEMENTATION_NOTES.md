
# Forum v2 Implementation Notes

## Repository Analysis (Completed: 2024-11-03)

### UI Component Libraries & CSS Approach
- **UI Framework**: shadcn/ui components (found in `apps/web/components/ui/`)
- **CSS**: Tailwind CSS with custom design tokens
- **Color Scheme**: 
  - Primary: `#D7FF3C` (lime green)
  - Secondary: `#9B5CFF` (purple)
  - Background: `#0a0a0a`, `#0b0b0b`, `#111111`
  - Border: `#1a1a1a`, `#2a2a2a`
- **Typography**: Default font with semibold/bold weights for headings

### Authentication & User Access
- **Auth System**: Custom session-based auth with bcrypt
- **Session Storage**: HTTP-only cookies (`session`, `auth-token`)
- **User ID Access**: `getSession()` helper in `apps/web/lib/auth.ts`
- **Session Check**: `getUserIdFromSession()` pattern in API routes

### Database Access Patterns
- **ORM**: Drizzle ORM (`packages/db/`)
- **Client**: `getDbClient()` from `@/lib/db-client` or `@thecueroom/db/client`
- **Migrations**: Located in `packages/db/migrations/`
- **Schema**: Comprehensive schema in `packages/db/schema.ts`

### Existing Forum Code
**Database Tables** (already exist):
- `forum_categories` - Categories with slug, description
- `forum_threads` - Threads with visibility, moderation status, AI summary
- `forum_replies` - Replies with moderation status
- `thread_likes` - User likes on threads
- `user_reputation` - Karma points and badges
- `forum_reports` - Content reporting
- `mod_actions` - Moderation history
- `thread_drafts` - Draft autosave
- `mentions` - @mention tracking
- `thread_followers` - Thread subscriptions
- `moderation_queue` - AI moderation workflow
- `forum_attachments` - File attachments

**Existing Components**:
- `apps/web/components/forum/ForumList.tsx` ✓
- `apps/web/components/forum/ThreadView.tsx` ✓
- `apps/web/components/forum/ThreadComposer.tsx` ✓
- `apps/web/components/forum/UserProfileCard.tsx` ✓
- `apps/web/components/forum/ProfileModal.tsx` ✓
- `apps/web/components/forum/ThreadAssistModal.tsx` ✓

**Existing API Endpoints**:
- `GET/POST /api/forum/thread` ✓
- `GET/POST /api/forum/thread/[id]` ✓
- `POST /api/forum/thread/[id]/reply` ✓
- `POST /api/forum/thread/[id]/like` ✓
- `GET /api/forum/categories` ✓
- `GET /api/forum/contributors` ✓
- `POST /api/forum/moderate` ✓
- `POST /api/forum/summarize` ✓
- `POST /api/forum/report` ✓
- `GET/POST /api/forum/attachments` ✓

**Existing Hooks**:
- `use-thread.ts` - Thread data fetching with optimistic updates
- `use-threads.ts` - Thread list with caching

### Realtime Setup
- **Provider**: Supabase Realtime client available (`apps/web/lib/supabase.ts`)
- **Pattern**: Create subscription hooks (not yet implemented for forum)
- **Location**: Planned at `apps/web/hooks/useRealtimeThread.ts`

### AI Integration
- **Moderation**: `packages/ai/moderation/index.ts` using Hugging Face Toxic-BERT
- **Summarization**: `packages/ai/summarizer/index.ts` using BART-CNN
- **Pattern**: Queue-based processing with LRU cache

### Validation Schemas
- **Location**: `packages/shared/forumSchemas.ts`
- **Library**: Zod for runtime validation
- **Schemas**: All forum operations already defined

## Implementation Plan

### Phase 1: Missing API Endpoints (Priority: HIGH)
Files to create:
1. `apps/web/app/api/forum/thread/save-draft/route.ts` - Draft autosave
2. `apps/web/app/api/forum/mention/resolve/route.ts` - Mention autocomplete
3. `apps/web/app/api/forum/reaction/route.ts` - Unified reactions endpoint
4. `apps/web/app/api/forum/view/route.ts` - View tracking with throttling
5. `apps/web/app/api/forum/ai/suggest/route.ts` - AI content suggestions
6. `apps/web/app/api/forum/moderation/flag/route.ts` - Flag content
7. `apps/web/app/api/forum/moderation/review/route.ts` - Admin review

### Phase 2: Realtime Updates (Priority: HIGH)
Files to create:
1. `apps/web/hooks/useRealtimeThread.ts` - Thread subscription
2. `apps/web/hooks/useRealtimeReplies.ts` - Reply subscription
3. `apps/web/lib/realtimeClient.ts` - Supabase config

### Phase 3: Enhanced Components (Priority: MEDIUM)
Files to update:
1. `apps/web/components/forum/ThreadComposer.tsx` - Add missing features
2. `apps/web/components/forum/ForumList.tsx` - Enhance filtering
3. `apps/web/components/forum/ThreadView.tsx` - Add realtime
4. `apps/web/components/forum/RightRail.tsx` - NEW component
5. `apps/web/components/forum/MentionAutocomplete.tsx` - NEW component
6. `apps/web/components/forum/AttachmentUploader.tsx` - NEW component

### Phase 4: Moderation Panel (Priority: MEDIUM)
Files to create:
1. `apps/web/app/(admin)/moderation/forum/page.tsx` - Admin UI
2. `apps/web/components/forum/ModerationPanel.tsx` - Review interface

### Phase 5: Tests & Stories (Priority: LOW)
Files to create:
1. `apps/web/components/forum/__tests__/*` - Unit tests
2. `e2e/forum-realtime.spec.ts` - E2E tests
3. `apps/web/.storybook/stories/Forum.stories.tsx` - Storybook

## Required Environment Variables
```
# Already configured
SUPABASE_URL=
SUPABASE_ANON_KEY=
HF_API_KEY= # For AI moderation
SESSION_SECRET=
DATABASE_URL=

# New (optional)
FORUM_V2_ENABLED=false # Feature flag
AI_MODERATION_THRESHOLD=0.7
```

## Migration Commands
```bash
# Database schema already exists, no new migrations needed
# Existing migration: packages/db/migrations/0001_forum_enhancements.sql

# To reset forum data (dev only):
psql $DATABASE_URL -c "TRUNCATE forum_threads, forum_replies CASCADE;"
```

## Compatibility Notes
- All forum DB tables already exist ✓
- Validation schemas already defined ✓
- AI moderation infrastructure ready ✓
- Need to add realtime subscriptions
- Need to complete API endpoint coverage
- Need to add comprehensive tests

## Divergence Decisions
1. **Skipping new migrations**: All required tables already exist
2. **Reusing existing components**: Most UI already implemented
3. **Focus areas**: Realtime, missing APIs, tests, moderation UI
4. **Feature flag**: Will use existing env pattern, not adding new flag system

## Rollback Plan
1. Disable FORUM_V2_ENABLED flag
2. Revert API endpoint changes if needed
3. Forum data preserved in DB (no destructive changes)
4. Old forum pages remain functional
