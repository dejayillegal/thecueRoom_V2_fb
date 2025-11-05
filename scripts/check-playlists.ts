
import { getDbClient } from '../apps/web/lib/db-client';
import { playlists } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';

async function checkPlaylists() {
  try {
    const db = getDbClient();
    
    const allPlaylists = await db.select().from(playlists);
    const livePlaylists = await db.select().from(playlists).where(eq(playlists.status, 'live'));
    
    console.log('\n📊 Playlist Status:');
    console.log('   Total playlists:', allPlaylists.length);
    console.log('   Live playlists:', livePlaylists.length);
    
    if (livePlaylists.length > 0) {
      console.log('\n🎵 Live Playlists:');
      livePlaylists.forEach(p => {
        console.log(`   - ${p.title} (${p.platform})`);
        console.log(`     Status: ${p.status}, Visibility: ${p.visibility}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking playlists:', error);
    process.exit(1);
  }
}

checkPlaylists();
