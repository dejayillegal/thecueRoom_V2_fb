
# Monthly Playlists - Usage Examples

## Example 1: Manual Playlist Addition

**Scenario:** Admin wants to add February 2025 playlist

```typescript
// Step 1: Validate URL
const response = await fetch('/api/admin/monthly-playlists/validate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M'
  })
});

const { ok, metadata } = await response.json();
// metadata: { title, platform, platformId, embedUrl, coverImage, trackCount }

// Step 2: Create as draft
await fetch('/api/admin/monthly-playlists/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ...metadata,
    monthOf: '2025-02-01T00:00:00Z',
    status: 'draft'
  })
});

// Step 3: Publish immediately
await fetch('/api/admin/monthly-playlists/publish', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ id: 'playlist-uuid' })
});
```

## Example 2: Scheduled Publication

**Scenario:** Schedule playlist to go live on Feb 1, 2025 at midnight UTC

```typescript
// Create playlist
const createRes = await fetch('/api/admin/monthly-playlists/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'February 2025 Underground Techno',
    platform: 'spotify',
    platformId: 'abc123',
    embedUrl: 'https://...',
    monthOf: '2025-02-01T00:00:00Z',
    status: 'draft'
  })
});

const { playlist } = await createRes.json();

// Schedule for publication
await fetch('/api/admin/monthly-playlists/schedule', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: playlist.id,
    scheduledAt: '2025-02-01T00:00:00Z'
  })
});

// Worker will automatically publish at scheduled time
```

## Example 3: AI Auto-Curation Setup

**Scenario:** Enable AI to generate playlists when none scheduled

```typescript
// Enable AI auto-curation
await fetch('/api/admin/monthly-playlists/toggle-auto', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    enabled: true,
    confidenceThreshold: 75,
    autoPublishOnConfidence: false, // Require manual review
    runWindowHours: 24
  })
});

// Worker will check daily and trigger AI generation
// 24 hours before month start if no playlist exists
```

## Example 4: Manual AI Generation

**Scenario:** Manually trigger AI to generate March playlist

```typescript
const response = await fetch('/api/admin/monthly-playlists/ai-generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    monthOf: '2025-03-01T00:00:00Z',
    historyMonths: 6,
    genrePreferences: ['techno', 'house', 'underground'],
    minConfidence: 70,
    fallbackMode: true
  })
});

const { jobId, status } = await response.json();

// Poll for job completion
const checkJob = async () => {
  const res = await fetch(`/api/admin/monthly-playlists/job/${jobId}`);
  const job = await res.json();
  
  if (job.status === 'completed') {
    console.log('AI playlist created:', job.resultData.playlistId);
    // Review and publish manually
  }
};
```

## Example 5: Rollback to Previous Version

**Scenario:** Revert to last month's playlist configuration

```typescript
// Get history
const historyRes = await fetch('/api/admin/monthly-playlists/history?playlistId=xyz');
const { history } = await historyRes.json();

// Find previous version
const previousVersion = history.find(h => h.action === 'published');

// Rollback
await fetch('/api/admin/monthly-playlists/rollback', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 'current-playlist-id',
    toHistoryId: previousVersion.id,
    reason: 'Incorrect tracks published'
  })
});
```

## Example 6: List and Filter Playlists

**Scenario:** Admin views all live playlists from last 6 months

```typescript
const response = await fetch(
  '/api/admin/monthly-playlists/list?' + new URLSearchParams({
    status: 'live',
    limit: '10',
    offset: '0'
  })
);

const { ok, playlists, hasMore } = await response.json();

playlists.forEach(playlist => {
  console.log({
    title: playlist.title,
    month: new Date(playlist.monthOf).toLocaleDateString(),
    platform: playlist.platform,
    tracks: playlist.trackCount,
    aiCurated: playlist.autoCurated,
    confidence: playlist.aiConfidenceScore
  });
});
```

## Example 7: Error Handling

**Scenario:** Handle validation and network errors gracefully

```typescript
try {
  const response = await fetch('/api/admin/monthly-playlists/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: invalidUrl })
  });

  const data = await response.json();

  if (!data.ok) {
    switch (data.error) {
      case 'Invalid playlist URL':
        toast.error('Please check the URL format');
        break;
      case 'Playlist not found':
        toast.error('Playlist is private or deleted');
        break;
      case 'Unsupported platform':
        toast.error('Only Spotify, SoundCloud, and Mixcloud supported');
        break;
      default:
        toast.error(data.error);
    }
  }
} catch (error) {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    toast.error('Network error - please check connection');
  } else {
    toast.error('Unexpected error occurred');
  }
}
```

## Example 8: Widget Integration

**Scenario:** Display latest monthly playlist on user dashboard

```typescript
// In MonthlyPlaylistWidget.tsx
useEffect(() => {
  async function fetchLatest() {
    try {
      const res = await fetch('/api/playlists/monthly/latest');
      const { ok, playlist } = await res.json();
      
      if (ok && playlist) {
        setPlaylist(playlist);
      }
    } catch (error) {
      setError('Failed to load playlist');
    }
  }
  
  fetchLatest();
}, []);

// Render with UnifiedEmbedPlayer
<UnifiedEmbedPlayer
  platform={playlist.platform}
  embedUrl={playlist.embedUrl}
  title={playlist.title}
/>
```

## Example 9: Multi-Platform Support

**Scenario:** Add playlists from different platforms

```typescript
// Spotify
await addPlaylist('https://open.spotify.com/playlist/xyz');

// SoundCloud
await addPlaylist('https://soundcloud.com/user/sets/playlist');

// Mixcloud
await addPlaylist('https://www.mixcloud.com/user/mix/');

async function addPlaylist(url: string) {
  const res = await fetch('/api/admin/monthly-playlists/validate', {
    method: 'POST',
    body: JSON.stringify({ url })
  });
  
  const { ok, metadata, platform } = await res.json();
  
  if (ok) {
    console.log(`Valid ${platform} playlist:`, metadata.title);
  }
}
```

## Example 10: Worker Monitoring

**Scenario:** Monitor worker health and job queue

```typescript
// Check worker status
const healthRes = await fetch('/api/admin/monthly-playlists/worker/health');
const { running, lastCheck, queueSize } = await healthRes.json();

// Get pending jobs
const jobsRes = await fetch('/api/admin/monthly-playlists/jobs?status=pending');
const { jobs } = await jobsRes.json();

jobs.forEach(job => {
  console.log({
    type: job.jobType,
    created: new Date(job.createdAt).toLocaleString(),
    status: job.status
  });
});
```
