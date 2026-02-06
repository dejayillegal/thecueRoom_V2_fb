import { getDbClient } from '@thecueroom/db/client';
import { users } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import ArtistProfilePage from '../../[id]/page';

export default async function ArtistProfileByUsernamePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const db = getDbClient();

  const artistRecords = await db.select().from(users).where(eq(users.username, username)).limit(1);
  
  if (artistRecords.length === 0) {
    notFound();
  }

  const artist = artistRecords[0];
  
  return <ArtistProfilePage params={Promise.resolve({ id: artist.id })} />;
}
