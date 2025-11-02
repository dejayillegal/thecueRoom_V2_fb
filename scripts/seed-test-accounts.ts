import { getDbClient } from '../packages/db/client';
import { users, profiles } from '@thecueroom/db/schema';
import bcrypt from 'bcryptjs';

async function seedTestAccounts() {
  console.log('\n🌱 Seeding test accounts...\n');

  const db = getDbClient();

  const testArtists = [
    {
      email: 'artist1@test.com',
      username: 'dj_phoenix',
      password: 'Test123!',
      role: 'artist',
      displayName: 'DJ Phoenix',
      artistName: 'Phoenix',
      bio: 'Techno DJ from Berlin',
      genre: 'Techno',
      region: 'Berlin, Germany',
    },
    {
      email: 'artist2@test.com',
      username: 'producer_nova',
      password: 'Test123!',
      role: 'artist',
      displayName: 'Producer Nova',
      artistName: 'Nova',
      bio: 'House producer from London',
      genre: 'House',
      region: 'London, UK',
    },
    {
      email: 'artist3@test.com',
      username: 'mixer_zen',
      password: 'Test123!',
      role: 'artist',
      displayName: 'Mixer Zen',
      artistName: 'Zen',
      bio: 'Ambient artist from Tokyo',
      genre: 'Ambient',
      region: 'Tokyo, Japan',
    },
  ];

  const testUsers = [
    {
      email: 'user1@test.com',
      username: 'music_fan_1',
      password: 'Test123!',
      role: 'user',
      displayName: 'Music Fan',
    },
    {
      email: 'user2@test.com',
      username: 'event_goer',
      password: 'Test123!',
      role: 'user',
      displayName: 'Event Enthusiast',
    },
  ];

  try {
    // Seed test artists
    for (const artist of testArtists) {
      const passwordHash = await bcrypt.hash(artist.password, 10);

      const [user] = await db
        .insert(users)
        .values({
          email: artist.email,
          username: artist.username,
          passwordHash,
          role: artist.role,
          verified: true,
        })
        .onConflictDoNothing()
        .returning();

      if (user) {
        await db
          .insert(profiles)
          .values({
            userId: user.id,
            displayName: artist.displayName,
            artistName: artist.artistName,
            bio: artist.bio,
            genre: artist.genre,
            region: artist.region,
          })
          .onConflictDoNothing();

        console.log(`✅ Created artist: ${artist.username} (${artist.email})`);
      } else {
        console.log(`⏭️  Artist already exists: ${artist.username}`);
      }
    }

    // Seed test users
    for (const testUser of testUsers) {
      const passwordHash = await bcrypt.hash(testUser.password, 10);

      const [user] = await db
        .insert(users)
        .values({
          email: testUser.email,
          username: testUser.username,
          passwordHash,
          role: testUser.role,
          verified: true,
        })
        .onConflictDoNothing()
        .returning();

      if (user) {
        await db
          .insert(profiles)
          .values({
            userId: user.id,
            displayName: testUser.displayName,
          })
          .onConflictDoNothing();

        console.log(`✅ Created user: ${testUser.username} (${testUser.email})`);
      } else {
        console.log(`⏭️  User already exists: ${testUser.username}`);
      }
    }

    console.log('\n✨ Test accounts seeded successfully!\n');
    console.log('📋 Test Login Credentials:');
    console.log('\nArtist Accounts:');
    testArtists.forEach((a) => {
      console.log(`  - ${a.username}: ${a.email} / ${a.password}`);
    });
    console.log('\nUser Accounts:');
    testUsers.forEach((u) => {
      console.log(`  - ${u.username}: ${u.email} / ${u.password}`);
    });
    console.log('');
  } catch (error) {
    console.error('❌ Error seeding test accounts:', error);
    throw error;
  }
}

seedTestAccounts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });