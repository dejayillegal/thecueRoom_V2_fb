import { getDbClient, closeDbClient } from '../packages/db/client';
import { users, profiles } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function seedTestAccounts() {
  console.log('\n🌱 Seeding test accounts...\n');

  const db = getDbClient();

  const testAccounts = [
    {
      email: 'dj_phoenix@test.com',
      username: 'dj_phoenix',
      displayName: 'DJ Phoenix',
      role: 'artist',
      bio: 'Techno producer from Bangalore',
    },
    {
      email: 'producer_nova@test.com',
      username: 'producer_nova',
      displayName: 'Producer Nova',
      role: 'artist',
      bio: 'Electronic music producer',
    },
    {
      email: 'mixer_zen@test.com',
      username: 'mixer_zen',
      displayName: 'Mixer Zen',
      role: 'artist',
      bio: 'House music DJ',
    },
    {
      email: 'techno.wizard@test.com',
      username: 'techno_wizard',
      displayName: 'Techno Wizard',
      role: 'artist',
      bio: 'Psytrance artist',
    },
    {
      email: 'liquidbass@test.com',
      username: 'liquidbass',
      displayName: 'Liquid Bass',
      role: 'artist',
      bio: 'Drum & Bass producer',
    },
    {
      email: 'underground.events@test.com',
      username: 'underground_events',
      displayName: 'Underground Events',
      role: 'user',
      bio: 'Event organizer',
    },
  ];

  for (const account of testAccounts) {
    try {
      const existing = await db.select().from(users).where(eq(users.email, account.email));

      if (existing.length === 0) {
        const passwordHash = await bcrypt.hash('test123', 10);

        const [newUser] = await db.insert(users).values({
          email: account.email,
          username: account.username,
          passwordHash,
          role: account.role,
          verified: true,
        }).returning();

        await db.insert(profiles).values({
          userId: newUser.id,
          displayName: account.displayName,
          bio: account.bio,
          aiCredits: 100,
        });

        console.log(`✅ Created ${account.role}: ${account.displayName} (${account.username})`);
      } else {
        console.log(`⏭️  User exists: ${account.displayName}`);
      }
    } catch (error) {
      console.error(`❌ Error creating ${account.displayName}:`, error);
    }
  }

  console.log('\n✨ Test accounts seeded successfully!');
  await closeDbClient();
}

seedTestAccounts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });