
# Player Implementation

## Overview

thecueRoom uses a **lightweight embed + external-open fallback** approach for playlist playback. This provides a scalable, cost-effective solution that works for all users without requiring authentication or premium accounts.

## Architecture

### UnifiedEmbedPlayer Component

The `UnifiedEmbedPlayer` component (`apps/web/components/Player/UnifiedEmbedPlayer.tsx`) is the central player component that:

1. **Renders provider-specific embed iframes** for Spotify, SoundCloud, and Mixcloud
2. **Provides "Open in App" buttons** for seamless deep-linking to native apps or web players
3. **Handles embed failures gracefully** with informative fallback UI
4. **Supports lazy loading** to optimize page performance

### Supported Platforms

- **Spotify**: Uses official Spotify embed iframes
- **SoundCloud**: Uses SoundCloud widget player
- **Mixcloud**: Uses Mixcloud embed widget

### API Endpoints

#### GET /api/player/spotify/metadata
Fetches playlist metadata using Spotify's client credentials flow.

**Query Parameters:**
- `playlistId` (required): Spotify playlist ID

**Response:**
```json
{
  "ok": true,
  "metadata": {
    "title": "Playlist Name",
    "description": "Playlist description",
    "coverImage": "https://...",
    "trackCount": 50,
    "platformId": "...",
    "embedUrl": "https://...",
    "owner": "Curator Name"
  }
}
```

#### POST /api/player/validate
Validates and extracts platform information from URLs.

**Request Body:**
```json
{
  "url": "https://open.spotify.com/playlist/..."
}
```

**Response:**
```json
{
  "ok": true,
  "platform": "spotify",
  "playlistId": "...",
  "embedUrl": "https://..."
}
```

## Deep Linking

The player automatically handles deep linking for native app opening:

- **Mobile**: Tries native app deep link (e.g., `spotify:playlist:ID`), falls back to web after 1.5s
- **Desktop**: Opens web player in new tab

### Deep Link Formats

- Spotify: `spotify:playlist:{id}` or `https://open.spotify.com/playlist/{id}`
- SoundCloud: `https://soundcloud.com/{user}/{set}`
- Mixcloud: `https://www.mixcloud.com/{user}/{show}/`

## Usage

### Basic Usage

```tsx
import { UnifiedEmbedPlayer } from '@/components/Player/UnifiedEmbedPlayer';

<UnifiedEmbedPlayer
  platform="spotify"
  playlistId="37i9dQZF1DXcBWIGoYBM5M"
  title="Today's Top Hits"
  coverImage="https://..."
  trackCount={50}
  showExternalButton={true}
/>
```

### Integration in LatestPlaylistWidget

The `LatestPlaylistWidget` component now uses `UnifiedEmbedPlayer` for all playlist displays, providing a consistent playback experience across the platform.

## Feature Flags

Currently, only the basic embed + external-open approach is implemented. Advanced features are controlled by:

- `FEATURE_EMBED_FALLBACK=true` (always on)
- `FEATURE_WEB_PLAYBACK=false` (not implemented - reserved for future Spotify Web Playback SDK integration)

## Future Enhancements (Not Implemented)

The following advanced features are documented for future implementation:

### Option A: In-App Web Playback (Advanced)

Would require:
- Spotify Web Playback SDK integration
- User OAuth flow for Spotify
- Premium account requirement
- BroadcastChannel for multi-tab coordination
- Refresh token management

**Not recommended** due to:
- High development cost
- User friction (OAuth + Premium requirement)
- Limited benefit over external player approach

## Testing

### Storybook Stories
Stories are available at `apps/web/components/Player/UnifiedEmbedPlayer.stories.tsx` for:
- Spotify playlists
- SoundCloud playlists
- Mixcloud shows
- Embed failure scenarios
- External button variants

### E2E Testing
Test that:
1. Embed loads correctly
2. External-open button generates correct URLs
3. Deep linking works on mobile/desktop
4. Fallback UI displays on embed failure

## Known Limitations

1. **Autoplay**: Browser restrictions prevent autoplay without user interaction
2. **SoundCloud/Mixcloud**: Limited programmatic control via widget APIs
3. **Spotify Premium**: Full track playback in embed requires user to have Spotify Premium (preview URLs available for all users)
4. **Mobile Deep Links**: Behavior varies by OS and installed apps

## Security & Privacy

- Uses official provider embeds and SDKs only
- No server-side streaming of copyrighted content
- Respects provider Terms of Service
- No user audio data logged; only playback events for analytics (if enabled)

## Performance

- Iframes are lazy-loaded to prevent blocking initial page paint
- Metadata is cached server-side with short TTL
- Embed failures fall back to lightweight fallback UI

## Support

For issues or questions, refer to:
- Provider documentation (Spotify, SoundCloud, Mixcloud)
- Replit workspace issues
- `docs/IMPLEMENTATION_NOTES.md` for general architecture
