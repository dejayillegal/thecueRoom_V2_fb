
import { getDbClient } from '../packages/db/client';
import { playlists } from '../packages/db/schema';

async function seedPlaylist() {
  const db = getDbClient();
  
  // Get the start of current week (Monday)
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const weekOf = new Date(now.setDate(diff));
  weekOf.setHours(0, 0, 0, 0);
  
  // Create a sample Spotify playlist (using the example from PLAYLISTS.md)
  const result = await db.insert(playlists).values({
    title: 'Weekly Underground Techno',
    description: 'Curated selection of underground techno tracks from around the globe',
    platform: 'spotify',
    platformId: '33TpZTRBetxMqTWC7UQEHy',
    embedUrl: 'https://open.spotify.com/embed/playlist/33TpZTRBetxMqTWC7UQEHy',
    weekOf: weekOf,
    visibility: 'public',
    status: 'live',
    curatedAt: new Date(),
  }).returning();

  console.log('✅ Playlist created:', result[0].id);
  console.log('   Title:', result[0].title);
  console.log('   Platform:', result[0].platform);
  console.log('   Status:', result[0].status);
  console.log('   Week Of:', result[0].weekOf);
  
  process.exit(0);
}

seedPlaylist().catch(console.error);
