
import { getDbClient } from '../apps/web/lib/db-client';
import { adminPlaylists } from '@thecueroom/db/schema';
import { eq, isNull, and } from 'drizzle-orm';

async function fixLivePlaylists() {
  console.log('Fixing live playlists without publishedAt...');
  
  const db = getDbClient();
  
  const result = await db
    .update(adminPlaylists)
    .set({
      publishedAt: new Date(),
    })
    .where(
      and(
        eq(adminPlaylists.status, 'live'),
        isNull(adminPlaylists.publishedAt)
      )
    )
    .returning({ id: adminPlaylists.id, title: adminPlaylists.title });
  
  console.log(`Fixed ${result.length} playlists:`);
  result.forEach(p => console.log(`- ${p.title} (${p.id})`));
}

fixLivePlaylists().catch(console.error);
