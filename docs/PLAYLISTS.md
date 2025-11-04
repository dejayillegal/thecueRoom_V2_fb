# Playlist Feature Documentation

## Overview

The thecueRoom Playlist feature provides a comprehensive system for curating, managing, and displaying music playlists across different platforms (Spotify, SoundCloud, etc.). The system supports AI-assisted curation, admin review workflows, and artist track suggestions.

## Features Implemented

### Database Schema

Three new tables have been added to support the playlist system:

1. **playlists** - Enhanced playlist table with:
   - Multi-platform support (Spotify, SoundCloud, Beatport, Mixcloud, Bandcamp, YouTube Music)
   - Status workflow (draft, queued, live, archived)
   - AI curation support with confidence scores
   - Scheduled publishing
   - Visibility controls (admin, featured, public)

2. **playlist_items** - Individual tracks within playlists:
   - Track metadata (title, artist, platform ID, URLs)
   - Position ordering for drag-drop reordering
   - AI scoring and rationale for each track
   - Cover images and preview URLs

3. **playlist_history** - Version history for rollback:
   - Snapshots of playlist changes
   - Change tracking (created, updated, published, archived)
   - Audit trail with user attribution

4. **track_suggestions** - Artist track submissions:
   - Platform and URL information
   - Review workflow (pending, approved, rejected)
   - Admin review notes

### API Endpoints

#### Public Endpoints

- `GET /api/playlists/list` - List playlists with filtering
  - Query params: `scope` (latest, featured, admin, queued, drafts), `page`, `limit`
  - Returns paginated playlist summaries

- `GET /api/playlists/get/[id]` - Get playlist details with items
  - Returns full playlist data including all tracks
  - Cached for live playlists

- `GET /api/playlists/suggestions` - Get track suggestions
  - Artists see their own suggestions
  - Admins see all suggestions with status filtering

- `POST /api/playlists/suggestions` - Submit track suggestion
  - Artists and admins can submit
  - Validates platform and URL

#### Admin Endpoints

- `POST /api/playlists/admin/update` - Create or update playlist
  - Full CRUD for playlists and items
  - Transaction-safe with history tracking
  - Supports reordering tracks by position

- `POST /api/playlists/admin/approve` - Approve/publish playlist
  - Publish immediately or schedule for future
  - Archive option for rejected playlists
  - Records approval in history

### UI Components

#### EmbedPlayer Component
Location: `apps/web/components/NowPlaying/EmbedPlayer.tsx`

Responsive iframe player that supports:
- Spotify embeds
- SoundCloud embeds  
- Mixcloud embeds
- Fallback to platform links if embed fails
- Lazy loading for performance

Usage:
```tsx
<EmbedPlayer
  platform="spotify"
  platformId="33TpZTRBetxMqTWC7UQEHy"
  title="Latest Playlist"
  height={400}
/>
```

#### LatestPlaylistWidget Component
Location: `apps/web/components/Dashboard/LatestPlaylistWidget.tsx`

Dashboard widget that displays the latest live playlist:
- Automatic fetch of latest playlist
- Platform embed player
- Role-specific CTAs (suggest track for artists, open playlist for all)
- Loading and error states

Usage:
```tsx
<LatestPlaylistWidget
  userRole="artist"
  onSuggestTrack={() => setShowSuggestModal(true)}
/>
```

## Environment Variables

Required environment variables:

```bash
# Database (already configured)
DATABASE_URL=postgresql://...

# Future additions for full AI curation:
# SPOTIFY_CLIENT_ID=your_spotify_client_id
# SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
# OPENAI_API_KEY=your_openai_api_key
```

## How to Use

### For Admins

1. **Create a Playlist**
   - Use POST `/api/playlists/admin/update` to create a new playlist
   - Add tracks with platform IDs and metadata
   - Set status to 'draft' for unpublished playlists

2. **Approve and Publish**
   - Use POST `/api/playlists/admin/approve` with `publish: true`
   - Optionally schedule publication for a future date
   - Playlist becomes visible to users when live

3. **Review Track Suggestions**
   - GET `/api/playlists/suggestions?status=pending` to see submissions
   - Review and approve quality tracks for inclusion

### For Artists

1. **View Latest Playlist**
   - The `LatestPlaylistWidget` shows the currently live playlist
   - Embedded player allows listening directly

2. **Suggest Tracks**
   - Submit track suggestions via POST `/api/playlists/suggestions`
   - Include platform, URL, and optional notes
   - Track review status in dashboard

### For Users

1. **Discover Music**
   - Latest playlist displayed in dashboard
   - Follow playlists on platform of choice
   - View past playlists in archive

## Testing the Embed

To test with the sample Spotify playlist provided:

```javascript
// Create a test playlist
await fetch('/api/playlists/admin/update', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Weekly Underground Techno',
    description: 'Curated selection of underground techno tracks',
    platform: 'spotify',
    platformId: '33TpZTRBetxMqTWC7UQEHy',
    embedUrl: 'https://open.spotify.com/embed/playlist/33TpZTRBetxMqTWC7UQEHy',
    visibility: 'public',
    items: []
  })
});

// Approve and publish
await fetch('/api/playlists/admin/approve', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 'playlist-id-from-above',
    publish: true
  })
});
```

## Future Enhancements

### Not Yet Implemented

1. **Admin PlaylistEditor UI** - Full-featured editor with:
   - Drag-and-drop track reordering
   - Inline metadata editing
   - AI confidence visualization
   - Bulk operations

2. **AI Curation Worker** - Automated playlist generation:
   - Discovery from Spotify/SoundCloud/Beatport APIs
   - AI scoring using OpenAI
   - Deduplication and metadata enrichment
   - Scheduled weekly execution

3. **Track Suggestion Modal** - UI for artists to submit tracks:
   - Platform selection
   - URL validation
   - Notes/reasoning field
   - Submission confirmation

## Database Migration

The migration has been applied automatically. To manually run:

```bash
cd packages/db
pnpm run migrate
```

## Architecture Decisions

### Transaction Safety
All playlist updates use database transactions to ensure:
- Playlist and items are updated atomically (delete-then-insert pattern)
- History snapshots include both playlist metadata AND all playlist_items for full rollback capability
- Orphaned items are prevented by deleting all items before inserting new ones within the same transaction
- Rollback capability with complete state reconstruction

### Caching Strategy
- Live playlists: Cached for 2 minutes (public access)
- Admin views: No cache (always fresh)
- Suggestions: No cache (real-time updates)

### Platform Support
The system is designed to be platform-agnostic:
- Each track stores its platform identifier
- Embed URLs are constructed based on platform
- Fallback to direct links if embeds unavailable

## Troubleshooting

### Playlist Not Showing
- Check status is 'live' in database
- Verify `curatedAt` timestamp is set
- Ensure visibility is not 'admin' only

### Embed Not Loading
- Verify platform and platformId are correct
- Check embed URL format
- Try direct platform link as fallback
- Check browser console for iframe errors

### Suggestions Not Appearing
- Verify user role is 'artist' or 'admin'
- Check track_suggestions table for submissions
- Confirm POST endpoint returns success

## Security

- All admin endpoints check for admin role before processing
- Track suggestions properly scoped: artists can ONLY see their own submissions, admins see all
- Status query parameters ignored for non-admin users to prevent enumeration
- SQL injection prevented by Drizzle ORM parameterized queries
- XSS protection through input validation and Zod schema enforcement
- Complete audit trail for all playlist changes with user attribution
