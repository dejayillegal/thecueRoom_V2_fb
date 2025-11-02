
#!/usr/bin/env tsx

import { getDbClient, closeDbClient, schema } from '../packages/db/client';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const TEST_ARTISTS = [
  {
    email: 'artist1@test.thecueroom.com',
    username: 'dj.techno.master',
    password: 'TestArtist123!',
    role: 'user',
    verified: true,
    verificationStatus: 'approved',
    profile: {
      firstName: 'Alex',
      lastName: 'Techno',
      displayName: 'DJ Techno Master',
      artistName: 'Techno Master',
      bio: 'Underground techno producer from Berlin',
      region: 'Berlin, Germany',
      genre: 'Techno, Deep Techno',
      socialProfileUrl: 'https://soundcloud.com/techno-master',
      aiCredits: 500,
    }
  },
  {
    email: 'artist2@test.thecueroom.com',
    username: 'dnb.producer.uk',
    password: 'TestArtist123!',
    role: 'user',
    verified: true,
    verificationStatus: 'approved',
    profile: {
      firstName: 'Sarah',
      lastName: 'Bass',
      displayName: 'DNB Producer',
      artistName: 'Bass Queen',
      bio: 'Drum & Bass producer from Bristol',
      region: 'Bristol, UK',
      genre: 'Drum & Bass, Liquid DnB',
      socialProfileUrl: 'https://soundcloud.com/bass-queen',
      aiCredits: 500,
    }
  },
  {
    email: 'artist3@test.thecueroom.com',
    username: 'house.selector.nyc',
    password: 'TestArtist123!',
    role: 'user',
    verified: true,
    verificationStatus: 'approved',
    profile: {
      firstName: 'Marcus',
      lastName: 'House',
      displayName: 'House Selector',
      artistName: 'Deep Selector',
      bio: 'Deep house DJ from New York',
      region: 'New York, USA',
      genre: 'Deep House, Tech House',
      socialProfileUrl: 'https://soundcloud.com/deep-selector',
      aiCredits: 500,
    }
  },
  {
    email: 'artist4@test.thecueroom.com',
    username: 'ambient.soundscape',
    password: 'TestArtist123!',
    role: 'user',
    verified: false,
    verificationStatus: 'pending',
    profile: {
      firstName: 'Luna',
      lastName: 'Sound',
      displayName: 'Ambient Soundscape',
      artistName: 'Lunar Waves',
      bio: 'Ambient and experimental electronic artist',
      region: 'Portland, USA',
      genre: 'Ambient, Experimental',
      socialProfileUrl: 'https://bandcamp.com/lunar-waves',
      aiCredits: 300,
    }
  },
  {
    email: 'artist5@test.thecueroom.com',
    username: 'breaks.master.uk',
    password: 'TestArtist123!',
    role: 'user',
    verified: true,
    verificationStatus: 'approved',
    profile: {
      firstName: 'Tom',
      lastName: 'Breaks',
      displayName: 'Breaks Master',
      artistName: 'Break King',
      bio: 'Breakbeat and jungle producer',
      region: 'London, UK',
      genre: 'Breakbeat, Jungle',
      socialProfileUrl: 'https://soundcloud.com/break-king',
      aiCredits: 500,
    }
  }
];

const TEST_USERS = [
  {
    email: 'user1@test.thecueroom.com',
    username: 'music.fan.001',
    password: 'TestUser123!',
    role: 'user',
    verified: true,
    verificationStatus: 'approved',
    profile: {
      firstName: 'John',
      lastName: 'Doe',
      displayName: 'John Doe',
      bio: 'Electronic music enthusiast',
      region: 'Los Angeles, USA',
      genre: 'All Electronic',
      aiCredits: 100,
    }
  },
  {
    email: 'user2@test.thecueroom.com',
    username: 'raver.girl.002',
    password: 'TestUser123!',
    role: 'user',
    verified: true,
    verificationStatus: 'approved',
    profile: {
      firstName: 'Emma',
      lastName: 'Smith',
      displayName: 'Emma Smith',
      bio: 'Techno and house music lover',
      region: 'Amsterdam, Netherlands',
      genre: 'Techno, House',
      aiCredits: 100,
    }
  },
  {
    email: 'user3@test.thecueroom.com',
    username: 'festival.goer.003',
    password: 'TestUser123!',
    role: 'user',
    verified: true,
    verificationStatus: 'approved',
    profile: {
      firstName: 'Mike',
      lastName: 'Johnson',
      displayName: 'Mike Johnson',
      bio: 'Festival enthusiast and event organizer',
      region: 'Ibiza, Spain',
      genre: 'All Genres',
      aiCredits: 100,
    }
  },
  {
    email: 'user4@test.thecueroom.com',
    username: 'vinyl.collector.004',
    password: 'TestUser123!',
    role: 'user',
    verified: false,
    verificationStatus: 'pending',
    profile: {
      firstName: 'David',
      lastName: 'Brown',
      displayName: 'David Brown',
      bio: 'Vinyl collector and music historian',
      region: 'Tokyo, Japan',
      genre: 'House, Disco',
      aiCredits: 100,
    }
  },
  {
    email: 'user5@test.thecueroom.com',
    username: 'dnb.head.005',
    password: 'TestUser123!',
    role: 'user',
    verified: true,
    verificationStatus: 'approved',
    profile: {
      firstName: 'Sophie',
      lastName: 'Williams',
      displayName: 'Sophie Williams',
      bio: 'Drum & Bass enthusiast',
      region: 'Bristol, UK',
      genre: 'Drum & Bass',
      aiCredits: 100,
    }
  }
];

async function seedTestAccounts() {
  try {
    console.log('\n🚀 Seeding Test Accounts for thecueRoom\n');
    console.log('═'.repeat(60));
    
    const db = getDbClient();
    
    // Seed Artists
    console.log('\n👨‍🎤 Creating Test Artist Accounts...\n');
    
    for (const artist of TEST_ARTISTS) {
      try {
        // Check if user exists
        const existing = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.email, artist.email))
          .limit(1);

        let userId: string;

        if (existing.length > 0 && existing[0]) {
          console.log(`   ⏭️  Artist ${artist.username} already exists`);
          userId = existing[0].id;
          
          // Update user
          await db
            .update(schema.users)
            .set({
              verified: artist.verified,
              verificationStatus: artist.verificationStatus
            })
            .where(eq(schema.users.id, userId));
        } else {
          // Create user
          const passwordHash = await bcrypt.hash(artist.password, 10);
          const [newUser] = await db
            .insert(schema.users)
            .values({
              email: artist.email,
              username: artist.username,
              passwordHash,
              role: artist.role,
              verified: artist.verified,
              verificationStatus: artist.verificationStatus,
            })
            .returning();

          if (!newUser) {
            throw new Error(`Failed to create artist: ${artist.username}`);
          }

          userId = newUser.id;
          console.log(`   ✅ Created artist: ${artist.username}`);
        }

        // Create or update profile
        const existingProfile = await db
          .select()
          .from(schema.profiles)
          .where(eq(schema.profiles.userId, userId))
          .limit(1);

        if (existingProfile.length === 0) {
          await db.insert(schema.profiles).values({
            userId,
            ...artist.profile,
          });
        } else {
          await db
            .update(schema.profiles)
            .set(artist.profile)
            .where(eq(schema.profiles.userId, userId));
        }
      } catch (error: any) {
        console.error(`   ❌ Error creating artist ${artist.username}:`, error.message);
      }
    }

    // Seed Regular Users
    console.log('\n👥 Creating Test User Accounts...\n');
    
    for (const user of TEST_USERS) {
      try {
        // Check if user exists
        const existing = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.email, user.email))
          .limit(1);

        let userId: string;

        if (existing.length > 0 && existing[0]) {
          console.log(`   ⏭️  User ${user.username} already exists`);
          userId = existing[0].id;
          
          // Update user
          await db
            .update(schema.users)
            .set({
              verified: user.verified,
              verificationStatus: user.verificationStatus
            })
            .where(eq(schema.users.id, userId));
        } else {
          // Create user
          const passwordHash = await bcrypt.hash(user.password, 10);
          const [newUser] = await db
            .insert(schema.users)
            .values({
              email: user.email,
              username: user.username,
              passwordHash,
              role: user.role,
              verified: user.verified,
              verificationStatus: user.verificationStatus,
            })
            .returning();

          if (!newUser) {
            throw new Error(`Failed to create user: ${user.username}`);
          }

          userId = newUser.id;
          console.log(`   ✅ Created user: ${user.username}`);
        }

        // Create or update profile
        const existingProfile = await db
          .select()
          .from(schema.profiles)
          .where(eq(schema.profiles.userId, userId))
          .limit(1);

        if (existingProfile.length === 0) {
          await db.insert(schema.profiles).values({
            userId,
            ...user.profile,
          });
        } else {
          await db
            .update(schema.profiles)
            .set(user.profile)
            .where(eq(schema.profiles.userId, userId));
        }
      } catch (error: any) {
        console.error(`   ❌ Error creating user ${user.username}:`, error.message);
      }
    }

    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('✨ Test Account Seeding Complete!\n');
    console.log('📊 Summary:');
    console.log(`   • ${TEST_ARTISTS.length} test artists`);
    console.log(`   • ${TEST_USERS.length} test users`);
    console.log('═'.repeat(60));
    console.log('\n🔑 Default Password for All Test Accounts:\n');
    console.log('   Artists: TestArtist123!');
    console.log('   Users:   TestUser123!\n');
    console.log('═'.repeat(60));
    console.log('\n📋 Test Artist Accounts:\n');
    TEST_ARTISTS.forEach((artist, idx) => {
      const status = artist.verified ? '✅ Verified' : '⏳ Pending';
      console.log(`   ${idx + 1}. ${status} - ${artist.email}`);
      console.log(`      Username: ${artist.username}`);
      console.log(`      Artist Name: ${artist.profile.artistName}`);
      console.log('');
    });
    console.log('═'.repeat(60));
    console.log('\n📋 Test User Accounts:\n');
    TEST_USERS.forEach((user, idx) => {
      const status = user.verified ? '✅ Verified' : '⏳ Pending';
      console.log(`   ${idx + 1}. ${status} - ${user.email}`);
      console.log(`      Username: ${user.username}`);
      console.log('');
    });
    console.log('═'.repeat(60));
    console.log('\n💡 Usage:');
    console.log('   Run: tsx scripts/seed-test-accounts.ts');
    console.log('   Or add to init: tsx scripts/init-all.ts\n');

    await closeDbClient();
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error seeding test accounts:', error);
    await closeDbClient();
    process.exit(1);
  }
}

seedTestAccounts();
