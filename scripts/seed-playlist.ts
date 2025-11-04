
import { getDbClient } from '../packages/db/client';
import { playlists } from '../packages/db/schema';

async function seedPlaylist() {
  const db = getDbClient();
  
  // Create a sample Spotify playlist (using the example from PLAYLISTS.md)
  const result = await db.insert(playlists).values({
    title: 'Weekly Underground Techno',
    description: 'Curated selection of underground techno tracks from around the globe',
    platform: 'spotify',
    platformId: '33TpZTRBetxMqTWC7UQEHy',
    embedUrl: 'https://open.spotify.com/embed/playlist/33TpZTRBetxMqTWC7UQEHy',
    visibility: 'public',
    status: 'live',
    curatorName: 'thecueRoom',
    curatedAt: new Date(),
    items: []
  }).returning();

  console.log('✅ Playlist created:', result[0].id);
  console.log('   Title:', result[0].title);
  console.log('   Platform:', result[0].platform);
  console.log('   Status:', result[0].status);
  
  process.exit(0);
}

seedPlaylist().catch(console.error);
