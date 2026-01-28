#!/usr/bin/env tsx

import { getDbClient } from '../packages/db/client';
import { users, profiles } from '../packages/db/schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';

const ACCOUNTS = [
  {
    email: 'dejayillegal@gmail.com',
    password: 'Closer@82',
    username: 'illegal.mastercue',
    role: 'admin',
    displayName: 'Illegal Mastercue',
    artistName: 'Illegal'
  },
  {
    email: 'test1@thecueroom.dev',
    password: 'Test@123',
    username: 'test.user.1',
    role: 'user',
    displayName: 'Test User One',
    artistName: 'TestArtist1'
  },
  {
    email: 'test2@thecueroom.dev',
    password: 'Test@123',
    username: 'test.user.2',
    role: 'user',
    displayName: 'Test User Two',
    artistName: 'TestArtist2'
  }
];

async function seed() {
  try {
    const db = getDbClient();
    console.log('🚀 Initializing idempotent seeding...');

    for (const acc of ACCOUNTS) {
      console.log(`👤 Processing ${acc.email}...`);
      
      const existing = await db.select().from(users).where(eq(users.email, acc.email)).limit(1).then(r => r[0]);

      let userId: string;
      const passwordHash = await bcrypt.hash(acc.password, 10);

      if (existing) {
        console.log(`   ✅ User exists, updating role and verification...`);
        await db.update(users).set({
          role: acc.role,
          verified: true,
          verificationStatus: 'approved'
        } as any).where(eq(users.id, existing.id));
        userId = existing.id;
      } else {
        console.log(`   🆕 Creating new user...`);
        const [newUser] = await db.insert(users).values({
          email: acc.email,
          username: acc.username,
          passwordHash,
          role: acc.role,
          verified: true,
          verificationStatus: 'approved'
        } as any).returning();
        userId = newUser.id;
      }

      const existingProfile = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1).then(r => r[0]);
      if (!existingProfile) {
        console.log(`   📄 Creating profile...`);
        await db.insert(profiles).values({
          userId,
          displayName: acc.displayName,
          artistName: acc.artistName,
          bio: 'Automated Account',
          aiCredits: 1000
        } as any);
      }
    }

    console.log('✨ Seeding complete.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
