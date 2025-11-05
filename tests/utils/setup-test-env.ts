
import { getDbClient } from '@/lib/db-client';
import { users, adminPlaylists } from '@thecueroom/db/schema';

export async function setupTestEnvironment() {
  console.log('Setting up test environment...');
  const db = getDbClient();

  try {
    // Clean existing test data
    console.log('Cleaning test data...');
    await db.delete(users).where(sql`email LIKE '%@test.example.com'`);
    await db.delete(adminPlaylists).where(sql`title LIKE 'Test%'`);

    // Seed test users
    console.log('Seeding test users...');
    await db.insert(users).values([
      {
        id: 'test-user-1',
        email: 'testuser@test.example.com',
        username: 'testuser',
        displayName: 'Test User',
        role: 'user',
        emailVerified: true,
      },
      {
        id: 'test-artist-1',
        email: 'testartist@test.example.com',
        username: 'testartist',
        displayName: 'Test Artist',
        role: 'artist',
        emailVerified: true,
        verified: true,
      },
    ]);

    console.log('Test environment ready!');
  } catch (error) {
    console.error('Failed to setup test environment:', error);
    throw error;
  }
}

if (require.main === module) {
  setupTestEnvironment()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
