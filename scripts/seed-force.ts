import { getDbClient } from '../packages/db/client';
import { users, profiles } from '../packages/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function seed() {
  const db = getDbClient();
  console.log('🌱 Starting idempotent seeding...');

  const usersToSeed = [
    {
      email: 'dejayillegal@gmail.com',
      password: 'Closer@82',
      role: 'admin',
      username: 'admin_dejay',
      displayName: 'Admin User',
    },
    {
      email: 'test1@thecue.room',
      password: 'Test@123',
      role: 'user',
      username: 'test_user_1',
      displayName: 'Test User 1',
    },
    {
      email: 'test2@thecue.room',
      password: 'Test@123',
      role: 'user',
      username: 'test_user_2',
      displayName: 'Test User 2',
    },
  ];

  for (const userData of usersToSeed) {
    try {
      const [existing] = await db.select().from(users).where(eq(users.email, userData.email)).limit(1);
      
      const passwordHash = await bcrypt.hash(userData.password, 10);
      let userId: string;

      if (existing) {
        console.log(`👤 User ${userData.email} exists, updating...`);
        await db.update(users)
          .set({ role: userData.role, verified: true, updated_at: new Date() })
          .where(eq(users.id, existing.id));
        userId = existing.id;
      } else {
        console.log(`👤 User ${userData.email} not found, creating...`);
        const [newUser] = await db.insert(users).values({
          email: userData.email,
          username: userData.username,
          passwordHash,
          role: userData.role,
          verified: true,
        }).returning();
        userId = newUser.id;
      }

      const [existingProfile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
      if (!existingProfile) {
        await db.insert(profiles).values({
          userId,
          displayName: userData.displayName,
        });
      }
    } catch (err) {
      console.error(`❌ Failed to seed ${userData.email}:`, err);
    }
  }

  console.log('✅ Seeding complete.');
  process.exit(0);
}

seed();
