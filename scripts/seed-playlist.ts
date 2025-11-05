import { getDbClient } from '../apps/web/lib/db-client';
import { playlists, playlistItems, users } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';

async function seedPlaylist() {
  try {
    const db = getDbClient();

    // Find or create admin user as curator
    let curator = await db.select().from(users).where(eq(users.email, 'admin@thecueroom.com')).limit(1);

    let curatorId = null;
    if (curator.length > 0) {
      curatorId = curator[0].id;
    }

    // Create a sample Spotify playlist
    const [playlist] = await db
      .insert(playlists)
      .values({
        title: 'Weekly Underground Techno',
        description: 'Curated selection of underground techno tracks from the global scene',
        platform: 'spotify',
        platformId: '37i9dQZF1DX6J5NfMJS675',
        embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX6J5NfMJS675',
        weekOf: new Date(),
        status: 'live',
        visibility: 'public',
        featured: true,
        curatedAt: new Date(),
        curatorId: curatorId,
      })
      .returning();

    console.log('✅ Playlist seeded:', playlist.title);
    console.log('   Platform:', playlist.platform);
    console.log('   Status:', playlist.status);
    console.log('   Embed URL:', playlist.embedUrl);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding playlist:', error);
    process.exit(1);
  }
}

seedPlaylist();