
import { getDbClient } from '../packages/db/client';
import { playlists } from '../packages/db/schema';
import { eq } from 'drizzle-orm';

async function seedPlaylist() {
  console.log('🎵 Seeding weekly Spotify playlist...\n');

  try {
    const db = getDbClient();
    
    // Get the start of current week (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const weekOf = new Date(now.setDate(diff));
    weekOf.setHours(0, 0, 0, 0);
    
    // Check if playlist already exists for this week
    const existing = await db.select().from(playlists).where(eq(playlists.weekOf, weekOf));
    
    if (existing.length > 0) {
      console.log('✅ Weekly playlist already exists');
      console.log('   Title:', existing[0].title);
      console.log('   Platform:', existing[0].platform);
      return;
    }
    
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
    console.log('\n✨ Spotify playlist seeding complete!');
    
  } catch (error) {
    console.error('❌ Error seeding playlist:', error);
    throw error;
  }
}

seedPlaylist()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }));
