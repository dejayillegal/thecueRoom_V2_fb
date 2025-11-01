#!/usr/bin/env tsx

import { getDbClient } from '../packages/db';
import { users, profiles } from '../packages/db/schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'dejayillegal@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Closer@82';
const ADMIN_USERNAME = 'illegal.mastercue';
const ADMIN_ARTIST_NAME = 'Illegal';
const ADMIN_DISPLAY_NAME = 'Illegal Mastercue';

async function seedAdmin() {
  try {
    console.log('🔧 Seeding admin user...');
    console.log(`📧 Admin email: ${ADMIN_EMAIL}`);

    const db = getDbClient();

    // Check if admin user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, ADMIN_EMAIL))
      .limit(1);

    let userId: string;

    if (existingUser.length > 0 && existingUser[0]) {
      console.log('✅ Admin user already exists');
      userId = existingUser[0].id;

      // Update to ensure admin role and verified status
      await db
        .update(users)
        .set({ 
          role: 'admin',
          verified: true,
          verificationStatus: 'verified_admin'
        })
        .where(eq(users.email, ADMIN_EMAIL));

      console.log('✅ Admin role and verification status updated');
    } else {
      // Hash password
      const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

      // Create admin user
      const [newUser] = await db
        .insert(users)
        .values({
          email: ADMIN_EMAIL,
          username: ADMIN_USERNAME,
          passwordHash,
          role: 'admin',
          verified: true,
          verificationStatus: 'approved'
        })
        .returning();

      if (!newUser) {
        throw new Error('Failed to create admin user');
      }

      userId = newUser.id;
      console.log('✅ Admin user created successfully');
      console.log(`🆔 User ID: ${userId}`);
    }

    // Check if profile exists
    const existingProfile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    if (existingProfile.length === 0) {
      // Create admin profile
      await db.insert(profiles).values({
        userId,
        displayName: ADMIN_DISPLAY_NAME,
        artistName: ADMIN_ARTIST_NAME,
        bio: 'thecueRoom Owner & Administrator',
        aiCredits: 10000,
        showEmail: false,
        showPhone: false,
        publicReleases: true,
        allowContactRequests: true,
      });
      console.log('✅ Admin profile created');
    } else {
      // Update existing profile with complete info
      await db
        .update(profiles)
        .set({
          displayName: ADMIN_DISPLAY_NAME,
          artistName: ADMIN_ARTIST_NAME,
          bio: 'thecueRoom Owner & Administrator',
          aiCredits: 10000,
        })
        .where(eq(profiles.userId, userId));
      console.log('✅ Admin profile updated');
    }

    console.log('\n✨ Admin setup complete!');
    console.log('─'.repeat(50));
    console.log('📋 Admin User Information:');
    console.log(`   Username: ${ADMIN_USERNAME}`);
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Artist Name: ${ADMIN_ARTIST_NAME}`);
    console.log(`   Display Name: ${ADMIN_DISPLAY_NAME}`);
    console.log(`   Verification Status: Approved`);
    console.log(`   Account Role: Admin, Owner`);
    console.log('─'.repeat(50));
    console.log('🔑 Login credentials:');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log('─'.repeat(50));
    console.log('\n🚀 You can now sign in at /dashboard');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
    process.exit(1);
  }
}

seedAdmin();