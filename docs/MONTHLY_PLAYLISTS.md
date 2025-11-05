# Monthly Playlists Feature

Complete implementation of the Monthly Curated Music system for theCueRoom.

## Overview

The Monthly Playlists feature replaces the previous weekly playlist system with a more sustainable monthly curation model. It includes:

- **Admin playlist management** with validation, scheduling, and publishing
- **AI auto-curation fallback** with mock mode for Replit testing
- **Multi-platform support** (Spotify, SoundCloud, Mixcloud)
- **Unified embed player** for consistent playback experience
- **History and rollback** functionality

## Architecture

### Database Schema

Three main tables support the feature:
- `admin_playlists` - Main playlists table with monthly tracking
- `admin_playlists_history` - Historical snapshots for rollback
- `playlist_auto_jobs` - AI curation job tracking

### Server Components

Located in `packages/server/`:
- `monthlyPlaylistWorker.ts` - Worker script for AI curation
- `spotifyAuthHelper.ts` - Spotify API integration with caching
- `mockAiAdapter.ts` - Deterministic mock AI for testing

### API Endpoints

#### Admin Endpoints (`/api/admin/monthly-playlists/`)
- `GET /list` - List playlists with filtering
- `POST /validate` - Validate playlist URLs
- `POST /create` - Create new playlist
- `POST /publish` - Publish playlist to live
- `POST /schedule` - Schedule future publish
- `POST /rollback` - Rollback to previous version
- `POST /toggle-auto` - Enable/disable AI fallback

#### AI Endpoints (`/api/ai/monthly-curate/`)
- `POST /run` - Trigger AI curation manually
- `GET /status?jobId=<uuid>` - Check job status

#### Player Endpoints
- `GET /api/player/metadata?url=<url>` - Fetch playlist metadata

## Replit Demo Mode

### Quick Start

1. Copy environment template:
   ```bash
   cp .env.example .env
   ```

2. Set mock mode (default):
   ```bash
   MOCK_AI=true
   FEATURE_MONTHLY_PLAYLISTS=true
   ```

3. Install dependencies:
   ```bash
   pnpm install
   ```

4. Run migrations (if needed):
   ```bash
   pnpm --filter @thecueroom/db migrate
   ```

5. Start server:
   ```bash
   pnpm dev
   ```

### Manual Worker Execution

Run the AI curation worker manually in Replit:

```bash
node packages/server/monthlyPlaylistWorker.js
```

Or trigger via API (requires admin auth):

```bash
curl -X POST http://localhost:5000/api/ai/monthly-curate/run \
  -H "Content-Type: application/json" \
  -d '{"monthOf": "2025-11-01T00:00:00Z"}'
```

### Mock AI Mode

When `MOCK_AI=true`, the system returns deterministic responses:
- No external API calls (free to run in Replit)
- Predictable playlist with 5 tracks
- 85% confidence score
- Useful for testing and demos

## Admin Workflows

### Manual Playlist Creation

1. Navigate to Admin → Monthly Playlists
2. Paste playlist URL (Spotify/SoundCloud/Mixcloud)
3. Click "Validate" to fetch metadata
4. Review preview and edit details
5. Save as Draft or Publish Now

### AI Auto-Curation

1. Enable auto-curation in admin settings
2. Set confidence threshold (default: 70%)
3. Worker runs and creates draft playlist
4. Admin reviews AI-generated playlist
5. Approve and publish or edit and publish

### Scheduling

1. Create or edit playlist
2. Set "Scheduled Publish Date"
3. Playlist auto-publishes at specified time
4. Previous month's playlist archived automatically

### Rollback

1. View playlist history
2. Select previous version
3. Confirm rollback
4. Playlist restored to selected state

## Environment Variables

### Required
- `DATABASE_URL` - PostgreSQL connection string
- `FEATURE_MONTHLY_PLAYLISTS=true` - Enable feature

### Optional (Spotify Integration)
- `SPOTIFY_CLIENT_ID` - Spotify app client ID
- `SPOTIFY_CLIENT_SECRET` - Spotify app secret

### Optional (AI Features)
- `MOCK_AI=true` - Use mock AI (recommended for Replit)
- `OPENAI_API_KEY` - OpenAI key for real AI (requires paid API)
- `AUTO_PUBLISH_AI_PLAYLISTS=false` - Auto-publish high-confidence playlists
- `AI_CONFIDENCE_THRESHOLD=70` - Minimum confidence for auto-publish

### Optional (Demo Access)
- `DEMO_ADMIN_KEY` - Admin API key for testing (use with Authorization header)

## Testing

### Manual Testing Flow

1. **Validate URL**:
   ```bash
   curl http://localhost:5000/api/admin/monthly-playlists/validate \
     -d '{"url": "https://open.spotify.com/playlist/37i9dQZF1DXdbXVyZ"}}'
   ```

2. **Run AI Worker**:
   ```bash
   curl -X POST http://localhost:5000/api/ai/monthly-curate/run \
     -d '{"monthOf": "2025-12-01"}'
   ```

3. **List Playlists**:
   ```bash
   curl http://localhost:5000/api/admin/monthly-playlists/list?limit=10
   ```

### Expected Results

With `MOCK_AI=true`:
- Worker completes in ~2 seconds
- Returns playlist with 5 tracks
- Confidence: 85%
- Status: draft (unless auto-publish enabled)

## Troubleshooting

### Worker Fails with "relation does not exist"
- Run migrations: `pnpm --filter @thecueroom/db migrate`

### API Returns 401 Unauthorized
- Ensure you're logged in as admin
- Or set `DEMO_ADMIN_KEY` and use Bearer token

### Spotify Metadata Returns Mock Data
- This is expected when `SPOTIFY_CLIENT_ID` not set
- Set Spotify credentials for real metadata

### LSP Errors in IDE
- Run `pnpm install` to install workspace dependencies
- TypeScript should resolve `@thecueroom/*` packages

## Production Deployment

### Real AI Mode

1. Set `MOCK_AI=false`
2. Provide `OPENAI_API_KEY`
3. Configure rate limits and quotas
4. Monitor costs and usage

### Scheduled Workers

Option 1: Use platform scheduler (Replit Deployments, Vercel Cron, etc.)
```bash
# Example cron job
0 0 1 * * node packages/server/monthlyPlaylistWorker.js
```

Option 2: Use HTTP endpoint with external scheduler
```bash
# Call /api/ai/monthly-curate/run monthly
```

### Security

- Use strong `ADMIN_SECRET` and `DEMO_ADMIN_KEY`
- Implement rate limiting on AI endpoints
- Validate all user inputs
- Log all admin actions for audit trail

## API Contracts

### Validate Playlist

**Request:**
```json
POST /api/admin/monthly-playlists/validate
{
  "url": "https://open.spotify.com/playlist/..."
}
```

**Response:**
```json
{
  "ok": true,
  "valid": true,
  "platform": "spotify",
  "platformId": "37i9dQZF1DXdbXVyZ",
  "title": "Electronic Hits",
  "trackCount": 50,
  "embedUrl": "https://open.spotify.com/embed/playlist/..."
}
```

### Create Playlist

**Request:**
```json
POST /api/admin/monthly-playlists/create
{
  "title": "November 2025 Electronic",
  "platform": "spotify",
  "platformId": "...",
  "embedUrl": "...",
  "monthOf": "2025-11-01T00:00:00Z"
}
```

**Response:**
```json
{
  "ok": true,
  "playlist": { "id": "...", "status": "draft", ... }
}
```

### Trigger AI Curation

**Request:**
```json
POST /api/ai/monthly-curate/run
{
  "monthOf": "2025-12-01T00:00:00Z",
  "genrePreferences": ["electronic", "techno"]
}
```

**Response:**
```json
{
  "ok": true,
  "jobId": "...",
  "playlistId": "...",
  "confidence": 85,
  "message": "Playlist saved as draft successfully"
}
```

## Support

For issues or questions:
1. Check logs in Replit console
2. Verify environment variables
3. Review `/tmp/logs/` for detailed worker logs
4. Check database connection and migrations
