#!/usr/bin/env tsx

import { getDbClient } from '../packages/db/client';
import { users, profiles, forumCategories, forumThreads, forumReplies, userReputation } from '../packages/db/schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';

const TEST_USERS = [
  {
    email: 'techno.producer@thecueroom.com',
    username: 'techno.wizard',
    password: 'Test123!',
    role: 'user',
    verified: true,
    verificationStatus: 'approved',
    profile: {
      displayName: 'Techno Wizard',
      artistName: 'DJ Minimal',
      bio: 'Berlin-based techno producer. Deep, dark, hypnotic sounds. 15 years in the underground scene.',
      region: 'Berlin, Germany',
      genre: 'Techno, Minimal Techno, Deep House',
      socialProfileUrl: 'https://soundcloud.com/techno-wizard',
      socialLinks: {
        soundcloud: 'https://soundcloud.com/techno-wizard',
        instagram: 'https://instagram.com/technowizard',
        spotify: 'https://open.spotify.com/artist/technowizard'
      } as Record<string, string>,
      aiCredits: 500,
    },
    karma: 450,
    badges: ['🔥 DJ Mentor', '💿 Label Head']
  },
  {
    email: 'dnb.producer@thecueroom.com',
    username: 'liquidbass',
    password: 'Test123!',
    role: 'user',
    verified: true,
    verificationStatus: 'approved',
    profile: {
      displayName: 'LiquidBass',
      artistName: 'LiquidBass',
      bio: 'Drum & Bass producer from Bristol. Liquid vibes and deep basslines. Signed to Hospital Records.',
      region: 'Bristol, UK',
      genre: 'Drum & Bass, Liquid DnB, Jungle',
      socialProfileUrl: 'https://soundcloud.com/liquidbass',
      socialLinks: {
        soundcloud: 'https://soundcloud.com/liquidbass',
        bandcamp: 'https://liquidbass.bandcamp.com',
        spotify: 'https://open.spotify.com/artist/liquidbass'
      } as Record<string, string>,
      aiCredits: 300,
    },
    karma: 320,
    badges: ['🎛️ Modular Nerd']
  },
  {
    email: 'warehouse.selector@thecueroom.com',
    username: 'selector.x',
    password: 'Test123!',
    role: 'user',
    verified: true,
    verificationStatus: 'approved',
    profile: {
      displayName: 'Selector X',
      artistName: 'Selector X',
      bio: 'Vinyl DJ specializing in warehouse sounds. UK Garage and Bass House connoisseur. London underground resident.',
      region: 'London, UK',
      genre: 'UK Garage, House, Bass House',
      socialProfileUrl: 'https://soundcloud.com/selector-x',
      socialLinks: {
        soundcloud: 'https://soundcloud.com/selector-x',
        mixcloud: 'https://mixcloud.com/selector-x',
        instagram: 'https://instagram.com/selectorx'
      } as Record<string, string>,
      aiCredits: 450,
    },
    karma: 280,
    badges: ['🔥 DJ Mentor']
  },
  {
    email: 'ambient.artist@thecueroom.com',
    username: 'ethereal.sounds',
    password: 'Test123!',
    role: 'user',
    verified: false,
    verificationStatus: 'pending',
    profile: {
      displayName: 'Ethereal Sounds',
      artistName: 'Ethereal',
      bio: 'Ambient and experimental electronic music producer. Creating sonic landscapes and atmospheric textures.',
      region: 'Portland, USA',
      genre: 'Ambient, Experimental, Downtempo',
      socialProfileUrl: 'https://bandcamp.com/etherealsounds',
      socialLinks: {
        bandcamp: 'https://etherealsounds.bandcamp.com',
        soundcloud: 'https://soundcloud.com/ethereal-sounds'
      } as Record<string, string>,
      aiCredits: 200,
    },
    karma: 150,
    badges: []
  },
  {
    email: 'festival.promoter@thecueroom.com',
    username: 'underground.events',
    password: 'Test123!',
    role: 'user',
    verified: true,
    verificationStatus: 'approved',
    profile: {
      displayName: 'Underground Events',
      artistName: 'Festival Curator',
      bio: 'Promoter and curator of underground electronic music events. Building community through music since 2010.',
      region: 'Amsterdam, Netherlands',
      genre: 'All Underground Genres',
      socialProfileUrl: 'https://instagram.com/undergroundevents',
      socialLinks: {
        instagram: 'https://instagram.com/undergroundevents',
        facebook: 'https://facebook.com/undergroundevents',
        website: 'https://undergroundevents.com'
      } as Record<string, string>,
      aiCredits: 600,
    },
    karma: 520,
    badges: ['💿 Label Head', '🎪 Event Curator']
  }
];

const FORUM_THREADS = [
  {
    username: 'techno.wizard',
    categorySlug: 'production',
    title: 'Best DAW for underground techno production?',
    slug: 'best-daw-for-underground-techno-production',
    body: `I've been producing techno for about 5 years now using Ableton, but I'm curious what other producers in the underground scene are using. 

I'm particularly interested in:
- Workflow efficiency for live sets
- Modular integration capabilities
- CPU efficiency when running multiple hardware synths

What's your go-to DAW and why? Would love to hear your experiences!`,
    tags: ['production', 'daw', 'techno', 'workflow'],
    isPinned: true,
    embedLinks: [],
    replies: [
      {
        username: 'liquidbass',
        body: `I switched from FL Studio to Ableton a few years ago and never looked back. The session view is perfect for live performances and jamming out ideas. Plus the Max for Live integration is unbeatable for creating custom devices.`
      },
      {
        username: 'selector.x',
        body: `Ableton all the way! The MIDI mapping and hardware integration is so smooth. I run it with my modular setup and it's rock solid even with tons of external gear.`
      }
    ]
  },
  {
    username: 'liquidbass',
    categorySlug: 'feedback',
    title: 'Feedback on my new liquid DnB track - "Midnight Rain"',
    slug: 'feedback-on-my-new-liquid-dnb-track-midnight-rain',
    body: `Just finished this liquid drum & bass track and would love some feedback from the community before I send it to labels.

https://soundcloud.com/liquidbass/midnight-rain-preview

Specifically looking for thoughts on:
- Mix balance (especially the sub bass)
- Arrangement flow
- Vocal chop processing

Any constructive criticism welcome! 🙏`,
    tags: ['feedback', 'dnb', 'liquid', 'production'],
    embedLinks: ['https://soundcloud.com/liquidbass/midnight-rain-preview'],
    replies: [
      {
        username: 'techno.wizard',
        body: `Really nice atmosphere! The vocal chops sit perfectly in the mix. Only suggestion would be to bring up the hi-hats a bit in the second drop - they get a bit lost behind the pads. Overall solid work though!`
      },
      {
        username: 'ethereal.sounds',
        body: `Beautiful textures! Love how the pads evolve throughout. The arrangement keeps things interesting without being too busy. The sub bass is perfectly balanced on my monitors.`
      }
    ]
  },
  {
    username: 'underground.events',
    categorySlug: 'events',
    title: 'Upcoming warehouse parties in Amsterdam - March 2025',
    slug: 'upcoming-warehouse-parties-in-amsterdam-march-2025',
    body: `Hey Amsterdam crew! 🎉

We're organizing a series of warehouse events in March featuring some incredible underground talent:

**March 8** - Techno & Industrial Night
Headliners: Ben Klock, Paula Temple, Amelie Lens

**March 15** - Jungle & DnB Session  
Headliners: Goldie, dBridge, Calibre

**March 22** - House & Garage Warehouse Rave
Headliners: DJ EZ, Todd Terry, MJ Cole

Limited capacity venues, killer sound systems, and all proceeds go to supporting local artists. Who's coming? 🔊`,
    tags: ['events', 'amsterdam', 'warehouse', 'techno', 'dnb'],
    isPinned: false,
    embedLinks: [],
    replies: [
      {
        username: 'selector.x',
        body: `The House & Garage night sounds absolutely massive! DJ EZ and MJ Cole on the same lineup is a dream. Count me in! 🙌`
      },
      {
        username: 'techno.wizard',
        body: `Paula Temple in a warehouse setting is going to be INSANE. I'll be there for the techno night for sure. See you on the dance floor!`
      },
      {
        username: 'liquidbass',
        body: `Can't miss the DnB session with that lineup. Calibre's sets are always special. Any chance of afterparty details? 👀`
      }
    ]
  },
  {
    username: 'ethereal.sounds',
    categorySlug: 'gear',
    title: 'Affordable modular synth setup for ambient music?',
    slug: 'affordable-modular-synth-setup-for-ambient-music',
    body: `I'm looking to get into modular synthesis specifically for creating ambient soundscapes and textures. Budget is around €1000-1500.

What would you recommend for a starter rack that focuses on:
- Generative sequences
- Evolving textures  
- Long-form compositions

I've been eyeing the Make Noise 0-Coast as a semi-modular starting point. Thoughts?`,
    tags: ['gear', 'modular', 'ambient', 'synthesis'],
    embedLinks: [],
    replies: [
      {
        username: 'techno.wizard',
        body: `The 0-Coast is a great starting point! I'd also recommend looking at Mutable Instruments modules on the used market. Plaits and Rings are perfect for ambient work and you can find them at good prices. Add a Marbles for generative sequences and you're golden.`
      }
    ]
  },
  {
    username: 'selector.x',
    categorySlug: 'discussion',
    title: 'The importance of vinyl in underground culture',
    slug: 'the-importance-of-vinyl-in-underground-culture',
    body: `With streaming dominating the music landscape, I wanted to start a discussion about vinyl's role in underground electronic music culture.

For me, vinyl represents:
- Tangible connection to the music
- Support for artists through physical sales
- The ritual of digging and collecting
- Better sound quality in club settings

But I also recognize the accessibility and reach that digital provides. What's your take? Is vinyl still essential to underground culture or is it becoming nostalgic gatekeeping?

Interested to hear different perspectives! 💿`,
    tags: ['discussion', 'vinyl', 'culture', 'djing'],
    embedLinks: [],
    replies: [
      {
        username: 'techno.wizard',
        body: `I think both have their place. I collect vinyl for the records I really love and want to support, but I also use digital for practical reasons. The sound quality argument is often overblown in my opinion - it's more about the connection and ritual for me.`
      },
      {
        username: 'underground.events',
        body: `From a promoter perspective, we've seen vinyl nights attract a different crowd - more engaged, more knowledgeable. But we also don't want to exclude talented DJs who can't afford an extensive vinyl collection. It's a balance.`
      },
      {
        username: 'liquidbass',
        body: `Digital allows for way more creativity in sets IMO. The ability to loop, edit on the fly, and access a massive library is invaluable. But I still buy vinyl of tracks I really want to own. Best of both worlds!`
      }
    ]
  }
];

async function seedTestUsers() {
  try {
    console.log('🚀 Seeding test users and forum content...\n');
    
    const db = getDbClient();
    const userMap = new Map<string, string>();
    const categoryMap = new Map<string, string>();

    // Get forum categories
    console.log('📂 Fetching forum categories...');
    const categories = await db.select().from(forumCategories);
    categories.forEach(cat => categoryMap.set(cat.slug, cat.id));
    console.log(`✅ Found ${categories.length} categories\n`);

    // Create test users and profiles
    console.log('👥 Creating test users...');
    for (const testUser of TEST_USERS) {
      // Check if user exists
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, testUser.email))
        .limit(1);

      let userId: string;

      if (existing.length > 0 && existing[0]) {
        console.log(`   ⏭️  User ${testUser.username} already exists`);
        userId = existing[0].id;
        
        // Update user
        await db
          .update(users)
          .set({
            verified: testUser.verified,
            verificationStatus: testUser.verificationStatus
          })
          .where(eq(users.id, userId));
      } else {
        // Create user
        const passwordHash = await bcrypt.hash(testUser.password, 10);
        const [newUser] = await db
          .insert(users)
          .values({
            email: testUser.email,
            username: testUser.username,
            passwordHash,
            role: testUser.role,
            verified: testUser.verified,
            verificationStatus: testUser.verificationStatus,
          })
          .returning();

        if (!newUser) {
          throw new Error(`Failed to create user: ${testUser.username}`);
        }

        userId = newUser.id;
        console.log(`   ✅ Created user: ${testUser.username} (${testUser.email})`);
      }

      userMap.set(testUser.username, userId);

      // Create or update profile
      const existingProfile = await db
        .select()
        .from(profiles)
        .where(eq(profiles.userId, userId))
        .limit(1);

      if (existingProfile.length === 0) {
        await db.insert(profiles).values({
          userId,
          ...testUser.profile,
        });
        console.log(`   ✅ Created profile for ${testUser.username}`);
      } else {
        await db
          .update(profiles)
          .set(testUser.profile)
          .where(eq(profiles.userId, userId));
        console.log(`   ✅ Updated profile for ${testUser.username}`);
      }

      // Create or update reputation
      const existingRep = await db
        .select()
        .from(userReputation)
        .where(eq(userReputation.userId, userId))
        .limit(1);

      if (existingRep.length === 0) {
        await db.insert(userReputation).values({
          userId,
          karmaPoints: testUser.karma,
          badges: testUser.badges,
        });
      } else {
        await db
          .update(userReputation)
          .set({
            karmaPoints: testUser.karma,
            badges: testUser.badges,
          })
          .where(eq(userReputation.userId, userId));
      }
    }

    console.log(`\n✅ Created/updated ${TEST_USERS.length} test users\n`);

    // Create forum threads and replies
    console.log('💬 Creating forum threads...');
    let threadCount = 0;
    let replyCount = 0;

    for (const threadData of FORUM_THREADS) {
      const userId = userMap.get(threadData.username);
      const categoryId = categoryMap.get(threadData.categorySlug);

      if (!userId || !categoryId) {
        console.log(`   ⚠️  Skipping thread "${threadData.title}" - user or category not found`);
        continue;
      }

      // Check if thread exists
      const existingThread = await db
        .select()
        .from(forumThreads)
        .where(eq(forumThreads.slug, threadData.slug))
        .limit(1);

      let threadId: string;

      if (existingThread.length > 0 && existingThread[0]) {
        threadId = existingThread[0].id;
        console.log(`   ⏭️  Thread "${threadData.title}" already exists`);
      } else {
        const [newThread] = await db
          .insert(forumThreads)
          .values({
            userId,
            categoryId,
            title: threadData.title,
            slug: threadData.slug,
            body: threadData.body,
            tags: threadData.tags,
            isPinned: threadData.isPinned || false,
            embedLinks: threadData.embedLinks,
            moderationStatus: 'approved',
            replyCount: threadData.replies?.length || 0,
          })
          .returning();

        if (!newThread) {
          throw new Error(`Failed to create thread: ${threadData.title}`);
        }

        threadId = newThread.id;
        threadCount++;
        console.log(`   ✅ Created thread: "${threadData.title}"`);
      }

      // Create replies
      if (threadData.replies && threadData.replies.length > 0) {
        for (const replyData of threadData.replies) {
          const replyUserId = userMap.get(replyData.username);
          if (!replyUserId) continue;

          // Check if similar reply exists
          const existingReply = await db
            .select()
            .from(forumReplies)
            .where(eq(forumReplies.threadId, threadId))
            .limit(1);

          if (existingReply.length === 0) {
            await db.insert(forumReplies).values({
              threadId,
              userId: replyUserId,
              body: replyData.body,
              moderationStatus: 'approved',
            });
            replyCount++;
            console.log(`      ↳ Reply by ${replyData.username}`);
          }
        }
      }
    }

    console.log(`\n✅ Created ${threadCount} threads with ${replyCount} replies\n`);

    // Summary
    console.log('═'.repeat(60));
    console.log('✨ Test data seeding complete!\n');
    console.log('📊 Summary:');
    console.log(`   • ${TEST_USERS.length} test users created`);
    console.log(`   • ${threadCount} forum threads created`);
    console.log(`   • ${replyCount} forum replies created`);
    console.log('═'.repeat(60));
    console.log('\n🔑 Test User Credentials:');
    console.log('   All passwords: Test123!\n');
    TEST_USERS.forEach(user => {
      const status = user.verified ? '✅ Verified' : '⏳ Pending';
      console.log(`   ${status} - ${user.email} (${user.username})`);
    });
    console.log('═'.repeat(60));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding test users:', error);
    process.exit(1);
  }
}

seedTestUsers();
