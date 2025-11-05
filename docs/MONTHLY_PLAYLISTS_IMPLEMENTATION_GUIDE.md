
# Monthly Playlists Implementation Guide

## Overview

The Monthly Playlists system provides automated music curation with AI fallback, scheduled publishing, and comprehensive admin controls.

## Features

### 1. Manual Playlist Management
- Add playlists via URL (Spotify, SoundCloud, Mixcloud)
- Automatic metadata extraction and validation
- Draft, schedule, or publish immediately
- Rollback to previous versions
- Archive management

### 2. AI Auto-Curation
- Automatic playlist generation when none scheduled
- Confidence scoring system
- Genre preference learning
- Historical pattern analysis
- Fallback mode for safety

### 3. Worker System
- Background scheduled publications
- AI fallback trigger (24h before month start)
- Health monitoring and error recovery
- Configurable polling intervals

## Architecture

```
┌─────────────────────┐
│   Admin Panel UI    │
│  (React Component)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   API Routes        │
│  - validate         │
│  - create           │
│  - publish          │
│  - schedule         │
│  - toggle-auto      │
│  - ai-generate      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Database          │
│  - admin_playlists  │
│  - playlist_jobs    │
└─────────────────────┘
           │
           ▼
┌─────────────────────┐
│   Worker Process    │
│  - Schedule check   │
│  - AI fallback      │
└─────────────────────┘
```

## Setup

### 1. Database Migration

Run the migration:
```bash
pnpm drizzle-kit push
```

### 2. Start Worker

In production:
```bash
node packages/workers/monthlyPlaylistWorker.js
```

In development:
```bash
tsx packages/workers/monthlyPlaylistWorker.ts
```

### 3. Configure Workflow

Add to `.replit` (already configured):
```toml
[workflows.monthlyWorker]
name = "Monthly Playlist Worker"
commands = ["tsx packages/workers/monthlyPlaylistWorker.ts"]
```

## Usage

### Admin Panel

Access: `/admin/monthly-playlists` (admin role required)

**Add a Playlist:**
1. Paste Spotify/SoundCloud/Mixcloud URL
2. Click "Add" to validate
3. Playlist auto-saved as draft
4. Click "Publish" to make live

**Enable AI Auto-Curation:**
1. Toggle "AI Auto-Curation" switch
2. System monitors for missing playlists
3. AI generates playlist 24h before month start
4. Admin reviews and publishes

**Filter & Manage:**
- Filter by status (draft, live, archived)
- Filter by platform
- View all historical playlists
- Rollback to previous versions

### API Endpoints

#### Validate Playlist
```bash
POST /api/admin/monthly-playlists/validate
{
  "url": "https://open.spotify.com/playlist/..."
}
```

#### Create Playlist
```bash
POST /api/admin/monthly-playlists/create
{
  "title": "January 2025",
  "platform": "spotify",
  "platformId": "abc123",
  "embedUrl": "https://...",
  "monthOf": "2025-01-01T00:00:00Z",
  "status": "draft"
}
```

#### Publish Playlist
```bash
POST /api/admin/monthly-playlists/publish
{
  "id": "playlist-uuid"
}
```

#### Toggle AI Auto-Curation
```bash
POST /api/admin/monthly-playlists/toggle-auto
{
  "enabled": true,
  "confidenceThreshold": 70,
  "autoPublishOnConfidence": false
}
```

#### Trigger AI Generation
```bash
POST /api/admin/monthly-playlists/ai-generate
{
  "monthOf": "2025-02-01T00:00:00Z",
  "historyMonths": 6,
  "minConfidence": 70
}
```

## Error Handling

### Validation Errors
- Invalid URL format
- Unsupported platform
- Playlist not found
- Network timeout

**Response:**
```json
{
  "ok": false,
  "error": "Invalid playlist URL"
}
```

### AI Generation Failures
- Low confidence score (< threshold)
- No historical data
- API timeout

**Fallback:**
- Job marked as failed
- Admin notified
- Manual intervention required

### Worker Errors
- Database connection lost
- Scheduled publish fails
- AI trigger timeout

**Recovery:**
- Automatic retry (3 attempts)
- Error logged to database
- Admin alert via notification system

## Testing

### Unit Tests
```bash
pnpm test tests/playlists/
```

### Integration Tests
```bash
pnpm test:integration
```

### E2E Tests
```bash
pnpm playwright test e2e/monthly-playlists.spec.ts
```

## Monitoring

### Health Check
```bash
curl http://localhost:5000/api/admin/monthly-playlists/health
```

### Job Status
```bash
GET /api/admin/monthly-playlists/jobs
```

Returns active and recent jobs with status.

## Best Practices

1. **Always test URLs** before publishing
2. **Review AI-generated playlists** before auto-publish
3. **Set confidence threshold** appropriately (70-85 recommended)
4. **Monitor worker logs** for errors
5. **Archive old playlists** regularly
6. **Keep 6+ months** of historical data for AI learning

## Troubleshooting

**Worker not running:**
- Check process: `ps aux | grep monthlyPlaylistWorker`
- Check logs: `tail -f logs/worker.log`
- Restart: `pnpm worker:restart`

**AI generation fails:**
- Verify OpenAI API key
- Check confidence threshold
- Review historical data availability

**Playlist not publishing:**
- Verify status is 'scheduled'
- Check scheduledAt date
- Verify worker is running
