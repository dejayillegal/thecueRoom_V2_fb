
import { getDbClient, closeDbClient } from '@thecueroom/db/client';
import { forumCategories, forumThreads, forumReplies, users, profiles, userReputation } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';

async function seedForumData() {
  const db = getDbClient();
  
  try {
    console.log('🌱 Seeding forum data...');

    // Get or create a test user
    let testUser = await db.select().from(users).where(eq(users.email, 'test@thecueroom.com')).limit(1);
    
    if (testUser.length === 0) {
      const userId = crypto.randomUUID();
      await db.insert(users).values({
        id: userId,
        email: 'test@thecueroom.com',
        username: 'testuser',
        role: 'user',
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await db.insert(profiles).values({
        userId: userId,
        displayName: 'Test User',
        bio: 'Test forum contributor',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await db.insert(userReputation).values({
        userId: userId,
        karmaPoints: 100,
        badges: ['early_adopter'],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      testUser = await db.select().from(users).where(eq(users.id, userId));
    }

    const userId = testUser[0].id;

    // Create categories
    const categories = [
      { name: 'General Discussion', slug: 'general', description: 'General chat about music and events' },
      { name: 'Production Tips', slug: 'production', description: 'Music production techniques and tips' },
      { name: 'Gear Talk', slug: 'gear', description: 'Discuss equipment and gear' },
      { name: 'Events', slug: 'events', description: 'Upcoming events and gigs' },
    ];

    const categoryIds: string[] = [];
    
    for (const cat of categories) {
      const existing = await db.select().from(forumCategories).where(eq(forumCategories.slug, cat.slug)).limit(1);
      
      if (existing.length === 0) {
        const catId = crypto.randomUUID();
        await db.insert(forumCategories).values({
          id: catId,
          ...cat,
          createdAt: new Date(),
        });
        categoryIds.push(catId);
        console.log(`✅ Created category: ${cat.name}`);
      } else {
        categoryIds.push(existing[0].id);
        console.log(`⏭️  Category exists: ${cat.name}`);
      }
    }

    // Create test threads
    const threads = [
      {
        categoryId: categoryIds[0],
        title: 'Welcome to thecueRoom Forum!',
        body: 'This is the official forum for the thecueRoom community. Share your thoughts, ask questions, and connect with fellow music enthusiasts!',
        tags: ['welcome', 'announcement'],
      },
      {
        categoryId: categoryIds[1],
        title: 'Best DAW for Electronic Music Production?',
        body: 'What DAW do you use for producing electronic music? I\'m currently using Ableton Live but curious about other options. Share your experiences!',
        tags: ['daw', 'production', 'electronic'],
      },
      {
        categoryId: categoryIds[2],
        title: 'Favorite MIDI Controller Under $500?',
        body: 'Looking to upgrade my MIDI controller setup. What are your recommendations for controllers under $500? Bonus points for ones with good pad response.',
        tags: ['midi', 'controller', 'gear'],
      },
      {
        categoryId: categoryIds[3],
        title: 'Upcoming Techno Events in India',
        body: 'Let\'s compile a list of upcoming techno events happening across India. Drop your event recommendations below!',
        tags: ['techno', 'india', 'events'],
      },
    ];

    const threadIds: string[] = [];

    for (const thread of threads) {
      const threadId = crypto.randomUUID();
      const slug = thread.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 100);
      
      await db.insert(forumThreads).values({
        id: threadId,
        categoryId: thread.categoryId,
        userId: userId,
        title: thread.title,
        slug: `${slug}-${threadId.slice(0, 8)}`,
        body: thread.body,
        tags: thread.tags,
        toxicityScore: 0,
        moderationStatus: 'approved',
        isHidden: false,
        isPinned: threadIds.length === 0, // Pin first thread
        viewCount: Math.floor(Math.random() * 100),
        replyCount: 0,
        likesCount: Math.floor(Math.random() * 20),
        createdAt: new Date(Date.now() - threadIds.length * 86400000), // Stagger dates
        updatedAt: new Date(),
      });

      threadIds.push(threadId);
      console.log(`✅ Created thread: ${thread.title}`);
    }

    // Create test replies
    const replies = [
      { threadIndex: 0, body: 'Excited to be part of this community! Looking forward to connecting with everyone here.' },
      { threadIndex: 1, body: 'I\'ve been using FL Studio for years and love it. The workflow is super intuitive for electronic music.' },
      { threadIndex: 1, body: 'Ableton Live is my go-to. The session view is perfect for live performances and jamming out ideas.' },
      { threadIndex: 2, body: 'Check out the Novation Launchpad Pro MK3. Great pads and the build quality is solid for the price.' },
      { threadIndex: 2, body: 'Native Instruments Komplete Kontrol series is amazing if you\'re in the NI ecosystem.' },
      { threadIndex: 3, body: 'Sunburn festival is coming up soon! Always a great lineup of international artists.' },
      { threadIndex: 3, body: 'Don\'t miss the underground warehouse parties in Bangalore. Some of the best techno vibes!' },
    ];

    for (const reply of replies) {
      const replyId = crypto.randomUUID();
      const threadId = threadIds[reply.threadIndex];
      
      await db.insert(forumReplies).values({
        id: replyId,
        threadId: threadId,
        userId: userId,
        body: reply.body,
        toxicityScore: 0,
        moderationStatus: 'approved',
        likesCount: Math.floor(Math.random() * 10),
        createdAt: new Date(Date.now() - Math.random() * 3600000), // Random time in last hour
        updatedAt: new Date(),
      });

      // Update thread reply count
      await db.update(forumThreads)
        .set({ 
          replyCount: (await db.select().from(forumReplies).where(eq(forumReplies.threadId, threadId))).length,
          updatedAt: new Date(),
        })
        .where(eq(forumThreads.id, threadId));

      console.log(`✅ Created reply on thread ${reply.threadIndex + 1}`);
    }

    console.log('\n✨ Forum seed data created successfully!');
    console.log(`   - ${categories.length} categories`);
    console.log(`   - ${threads.length} threads`);
    console.log(`   - ${replies.length} replies`);

  } catch (error) {
    console.error('❌ Error seeding forum data:', error);
    throw error;
  } finally {
    await closeDbClient();
  }
}

seedForumData();
