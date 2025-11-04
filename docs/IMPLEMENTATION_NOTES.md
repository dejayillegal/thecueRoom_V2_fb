
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

---

# News Filters + Notifications + Artist Verification Implementation Notes

**Date:** November 4, 2025  
**Task:** Fix News filters + implement notifications/toasts + complete Artist signup verification (AI auto-verify)

## Current Architecture Analysis

### 1. News Feed System

**Current Implementation:**
- **API Endpoint:** `apps/web/app/api/feeds/route.ts`
  - Supports: `category`, `sourceId`, `limit`, `cursor`, `offset`
  - Uses cursor-based pagination (timestamp_id format)
  - Filters by source tags using PostgreSQL array operators
  - Returns feeds from last 14 days only
  - Left joins with `sources` table for source names
  
- **Frontend:** `apps/web/app/news/page.tsx`
  - Client-side search and tag filtering
  - Uses `useState` for `selectedTags` and `searchQuery`
  - Simple loading states (loading, empty)
  - No URL parameter synchronization
  - Static tag list hardcoded: `["techno", "house", "production", "gear", "events", "interviews"]`

**Gaps to Address:**
- ❌ No server-side search filtering (title/summary)
- ❌ No sorting options (latest/popular)
- ❌ No date range filtering
- ❌ No platform filtering (Spotify, SoundCloud, etc.)
- ❌ No verified artists toggle
- ❌ Filter state not synced to URL params
- ❌ No proper empty/error states with CTAs
- ❌ No caching headers or server-side cache

---

### 2. Authentication System

**Backend (Server-Side):**
- **Library:** `jose` for JWT signing/verification
- **Session Storage:** HTTP-only cookie named `thecue_session`
- **Duration:** 7 days
- **Key Functions** (`src/lib/auth.ts`):
  - `createToken(UserPayload)` - Creates JWT
  - `verifyToken(token)` - Verifies JWT and returns payload
  - `setSessionCookie(token)` - Sets HTTP-only cookie
  - `getSessionCookie()` - Retrieves session from cookies
  - `getCurrentUser()` - Returns current user from session or null

**UserPayload Interface:**
```typescript
interface UserPayload {
  uid: string;
  email: string;
  role?: string;
  emailVerified?: boolean;
}
```

**How to Get User ID:**
- **Backend API Routes:** Use `getCurrentUser()` from `src/lib/auth.ts`
- **Frontend:** Access user via context/hooks (to be determined)

---

### 3. Notifications & Toasts

**Existing Toast System:**
- **Library:** `sonner` (imported as `Toaster` in `src/app/layout.tsx`)
- **Hook:** `useToast()` from `src/hooks/use-toast.ts`
  - Actions: `ADD_TOAST`, `UPDATE_TOAST`, `DISMISS_TOAST`, `REMOVE_TOAST`
  - Limit: 3 toasts max
  - Auto-dismiss: 5000ms delay
  - Supports: title, description, action, variant

**Existing Notification Database:**
- **Table:** `notifications` in `packages/db/schema.ts` ✓
  - Fields: id, userId, type, title, message, link, read (boolean), data (jsonb), createdAt
  - Indexes: userIdIdx, readIdx, createdAtIdx
  - Cascade delete on user deletion

**API Endpoints:**
- **GET `/api/notifications/route.ts`** ✓ - Fetches user notifications
- **PATCH `/api/notifications/route.ts`** ✓ - Marks notification as read

**Gaps to Address:**
- ❌ No unified `NotificationsPanel` component
- ❌ No unread count badge in nav
- ❌ No pending toast support (with spinner, updatable)
- ❌ No real-time notification updates

---

### 4. Signup & Verification Flow

**Current Components:**
- `components/Auth/SignupModal.tsx` - Artist signup form
- `components/Auth/VerificationModal.tsx` - Displays verification status

**Database Schema:**
- `users` table: id, email, passwordHash, role, emailVerified, createdAt
- `profiles` table: id, userId, username, firstName, lastName, artistName, displayName, bio, region, genre, isArtist, artistVerified, publicProfileUrl, musicPlatformLink, socialLinks (jsonb)

**Gaps to Address:**
- ❌ No `signup_verifications` table for audit trail
- ❌ No AI verification worker implementation
- ❌ No `/api/signup/verify/route.ts` endpoint
- ❌ No `/api/ai/verify/route.ts` endpoint
- ❌ No duplicate account checks
- ❌ No social links limit enforcement (max 5)
- ❌ No URL validation for platform links
- ❌ No rate limiting on signup attempts

---

## Database Schema Changes Needed

### New Table: `signup_verifications`
```sql
CREATE TABLE signup_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  input JSONB NOT NULL,
  result JSONB,
  ai_score NUMERIC(5, 2),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMP
);

CREATE INDEX idx_signup_verifications_profile_id ON signup_verifications(profile_id);
CREATE INDEX idx_signup_verifications_status ON signup_verifications(status);
```

---

## Implementation Phases

### Phase 1: Database & Migrations
1. Create `migrations/20251105_notifications_and_signup.sql`
2. Add `signup_verifications` table
3. Update Drizzle schema in `packages/db/schema.ts`

### Phase 2: News Filters API
1. Create `/api/news/list/route.ts` with Zod validation
2. Support: search, tags, dateRange, platform, sort, verifiedOnly
3. Implement caching with HTTP headers

### Phase 3: News Filters UI
1. Create `components/News/NewsFilters.tsx`
2. Create `components/News/NewsList.tsx`
3. Update `app/news/page.tsx`
4. Sync filter state with URL params

### Phase 4: Toast & Notifications
1. Enhance `useToast` hook with pending/update support
2. Create `components/Notifications/NotificationsPanel.tsx`
3. Add unread count badge to nav

### Phase 5: Signup Flow
1. Create shared Zod schemas: `packages/shared/signupSchemas.ts`
2. Update `components/Auth/SignupModal.tsx`
3. Implement `/api/signup/route.ts` with duplicate checks
4. Implement `/api/ai/verify/route.ts`

### Phase 6: AI Verification Worker
1. Create `packages/server/aiVerifier.ts`
2. Poll `signup_verifications` for pending jobs
3. Integrate OpenAI for verification
4. Update profile and create notifications

---

## Key Design Decisions

1. **Toast Updates:** Use toast ID for updating pending → success/failure
2. **Verification Queue:** Database-driven job queue (no Redis)
3. **Feature Flags:** `FEATURE_AI_VERIFY`, `ENABLE_NEW_TOAST`
4. **Caching:** HTTP cache headers + in-memory for news feeds
5. **URL Params:** Next.js `useSearchParams` + `useRouter`

---

## Security Considerations

1. JWT Secret: Ensure `JWT_SECRET` env var in production
2. Rate Limiting: IP-based (3 attempts per 15 min)
3. Input Validation: Zod schemas for all endpoints
4. XSS Protection: Sanitize user inputs
5. CSRF: HTTP-only cookies + SameSite=lax ✓

---

## Dependencies

- All required libraries already installed ✓
- OpenAI API key required: `OPENAI_API_KEY`

---

**Status Update - November 4, 2025:**

✅ **Database Schema - Already Complete!**
- `signup_verifications` table exists (lines 509-522 in schema.ts)
- `notifications` table exists (lines 524-538 in schema.ts)
- All required indexes are in place
- No migration needed - can skip Phase 1!

**Next Steps:** Begin Phase 2 - News Filters API Implementation
