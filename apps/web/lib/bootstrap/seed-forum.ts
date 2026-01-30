import { getDbClient } from '@thecueroom/db/client';
import { sql } from 'drizzle-orm';

interface ForumCategory {
  name: string;
  slug: string;
  description: string;
}

interface ForumThread {
  categorySlug: string;
  title: string;
  slug: string;
  body: string;
  tags: string[];
  isPinned?: boolean;
}

const FORUM_CATEGORIES: ForumCategory[] = [
  {
    name: 'General Discussion',
    slug: 'general',
    description: 'Open discussions about music, the industry, and everything in between.',
  },
  {
    name: 'Production Tips',
    slug: 'production',
    description: 'Share and discover production techniques, mixing tips, and studio setups.',
  },
  {
    name: 'Collaborations',
    slug: 'collaborations',
    description: 'Find collaborators, share project ideas, and connect with other artists.',
  },
  {
    name: 'Industry News',
    slug: 'industry-news',
    description: 'Discuss the latest news, trends, and happenings in the music industry.',
  },
  {
    name: 'Feedback & Reviews',
    slug: 'feedback',
    description: 'Get constructive feedback on your tracks, mixes, and productions.',
  },
];

const FORUM_THREADS: ForumThread[] = [
  {
    categorySlug: 'general',
    title: 'Welcome to thecueRoom Community!',
    slug: 'welcome-to-thecueroom-community',
    body: `Welcome to thecueRoom community forums! This is your space to connect with fellow music creators, share ideas, and grow together.

**What you can do here:**
- Share your music journey and experiences
- Ask questions and get advice from the community
- Discover new artists and collaborators
- Stay updated on industry trends

Feel free to introduce yourself in this thread! Tell us about your musical background, what genres you're into, and what you're working on.

Let's build something amazing together. 🎵`,
    tags: ['welcome', 'community', 'introduction'],
    isPinned: true,
  },
  {
    categorySlug: 'production',
    title: 'Essential Plugins Every Producer Should Know',
    slug: 'essential-plugins-every-producer-should-know',
    body: `After years of producing, here are some plugins that I consider essential for any producer's toolkit:

**EQ & Dynamics:**
- FabFilter Pro-Q 3 - The gold standard for EQ
- SSL G-Master Bus Compressor - Classic mix bus glue

**Synths:**
- Serum - Incredibly versatile wavetable synth
- Omnisphere - Perfect for cinematic sounds

**Effects:**
- Valhalla VintageVerb - Beautiful, affordable reverb
- Soundtoys bundle - Creative effects galore

What are your essential plugins? Drop your recommendations below!`,
    tags: ['plugins', 'production', 'vst', 'tips'],
  },
  {
    categorySlug: 'production',
    title: 'How to Get That Professional Low-End in Your Mixes',
    slug: 'professional-low-end-mixing-guide',
    body: `Struggling with muddy bass? Here's my approach to getting clean, powerful low-end:

**1. High-pass everything that doesn't need bass**
This is crucial. Cut everything below 80-100Hz on most tracks except your kick and bass.

**2. Sidechain compression**
Light sidechain compression on your bass triggered by the kick creates space and punch.

**3. Mono below 120Hz**
Keep your sub frequencies in mono for a tighter low-end, especially for club play.

**4. Reference constantly**
Compare your low-end to professional tracks in the same genre.

What are your low-end tips? Share below!`,
    tags: ['mixing', 'bass', 'low-end', 'tips'],
  },
  {
    categorySlug: 'collaborations',
    title: 'Looking for Vocalists for Electronic/House Project',
    slug: 'looking-for-vocalists-electronic-house',
    body: `Hey everyone!

I'm a producer based in LA working on an electronic/house EP and looking for vocalists to collaborate with.

**Project Details:**
- Genre: Deep House / Tech House with pop sensibilities
- Vibe: Melodic, emotional, dancefloor-ready
- Timeline: Flexible, looking to release Q2 2026

**What I'm looking for:**
- Unique vocal tone
- Experience recording remotely
- Open to both topline and co-writing

If interested, drop a link to your work below or DM me. Let's create something special!`,
    tags: ['collab', 'vocals', 'house', 'producer'],
  },
  {
    categorySlug: 'industry-news',
    title: 'AI in Music: Threat or Opportunity?',
    slug: 'ai-in-music-threat-or-opportunity',
    body: `With AI tools becoming more sophisticated, the music industry is at a crossroads. What are your thoughts?

**Arguments for AI as an opportunity:**
- Democratizes music production
- Speeds up workflow for professionals
- Creates new creative possibilities

**Arguments for AI as a threat:**
- May devalue human creativity
- Copyright and ownership concerns
- Could flood market with generated content

I believe the key is using AI as a tool to enhance human creativity, not replace it. What's your take?`,
    tags: ['ai', 'industry', 'discussion', 'future'],
  },
  {
    categorySlug: 'feedback',
    title: 'Community Guidelines for Giving Feedback',
    slug: 'community-guidelines-for-giving-feedback',
    body: `To make this feedback section valuable for everyone, here are some guidelines:

**When giving feedback:**
1. Be specific - "The snare sounds harsh" is better than "drums are bad"
2. Be constructive - Suggest solutions, not just problems
3. Start with positives - Acknowledge what works before critiquing
4. Be respectful - Remember there's a person behind every track

**When receiving feedback:**
1. Don't take it personally - Feedback is about the music, not you
2. Ask clarifying questions - Make sure you understand the feedback
3. Thank people for their time - They're helping you improve

Let's build a supportive community where everyone can grow! 🎧`,
    tags: ['guidelines', 'feedback', 'community'],
    isPinned: true,
  },
];

let forumSeedingComplete = false;
let forumSeedingAttempted = false;

export async function ensureForumContent(): Promise<{ success: boolean; message: string }> {
  if (forumSeedingComplete) {
    return { success: true, message: 'Forum already seeded' };
  }

  if (forumSeedingAttempted) {
    return { success: false, message: 'Forum seeding already attempted' };
  }

  forumSeedingAttempted = true;
  console.log('[Bootstrap] Starting forum content seeding...');

  try {
    const db = getDbClient();

    const tableCheck = await db.execute(
      sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'forum_categories') as exists`
    );
    
    const tableExists = tableCheck.rows && tableCheck.rows.length > 0 && (tableCheck.rows[0] as any).exists;
    
    if (!tableExists) {
      console.log('[Bootstrap] Forum tables do not exist yet. Skipping forum seed.');
      forumSeedingAttempted = false;
      return { success: false, message: 'Forum tables do not exist' };
    }

    const categoryIdMap: Record<string, string> = {};

    for (const category of FORUM_CATEGORIES) {
      const existing = await db.execute(
        sql`SELECT id FROM forum_categories WHERE slug = ${category.slug} LIMIT 1`
      );

      if (existing.rows && existing.rows.length > 0) {
        categoryIdMap[category.slug] = (existing.rows[0] as { id: string }).id;
      } else {
        const result = await db.execute(
          sql`INSERT INTO forum_categories (name, slug, description, thread_count, created_at) 
              VALUES (${category.name}, ${category.slug}, ${category.description}, 0, NOW()) 
              RETURNING id`
        );
        if (result.rows && result.rows.length > 0) {
          categoryIdMap[category.slug] = (result.rows[0] as { id: string }).id;
          console.log(`[Bootstrap] Created forum category: ${category.name}`);
        }
      }
    }

    const adminResult = await db.execute(
      sql`SELECT id FROM users WHERE role = 'admin' LIMIT 1`
    );

    if (!adminResult.rows || adminResult.rows.length === 0) {
      console.log('[Bootstrap] No admin user found. Skipping forum thread seeding.');
      forumSeedingComplete = true;
      return { success: true, message: 'Categories seeded, no admin for threads' };
    }

    const adminUserId = (adminResult.rows[0] as { id: string }).id;

    for (const thread of FORUM_THREADS) {
      const categoryId = categoryIdMap[thread.categorySlug];
      if (!categoryId) {
        console.log(`[Bootstrap] Category not found for thread: ${thread.title}`);
        continue;
      }

      const existing = await db.execute(
        sql`SELECT id FROM forum_threads WHERE slug = ${thread.slug} LIMIT 1`
      );

      if (existing.rows && existing.rows.length > 0) {
        continue;
      }

      await db.execute(
        sql`INSERT INTO forum_threads (user_id, category_id, title, slug, body, tags, view_count, reply_count, likes_count, is_pinned, moderation_status, created_at, updated_at) 
            VALUES (${adminUserId}::uuid, ${categoryId}::uuid, ${thread.title}, ${thread.slug}, ${thread.body}, ${JSON.stringify(thread.tags)}::jsonb, 0, 0, 0, ${thread.isPinned || false}, 'approved', NOW(), NOW())`
      );

      await db.execute(
        sql`UPDATE forum_categories SET thread_count = thread_count + 1 WHERE id = ${categoryId}::uuid`
      );

      console.log(`[Bootstrap] Created forum thread: ${thread.title}`);
    }

    forumSeedingComplete = true;
    console.log('[Bootstrap] Forum content seeding complete.');
    return { success: true, message: 'Forum seeding complete' };
  } catch (error: any) {
    if (error?.code === '42P01') {
      console.log('[Bootstrap] Forum tables not ready. Will retry on next request.');
      forumSeedingAttempted = false;
      return { success: false, message: 'Tables not ready' };
    }
    console.error('[Bootstrap] FAILED to seed forum content:', error);
    return { success: false, message: error?.message || 'Unknown error' };
  }
}

export function isForumSeedingComplete(): boolean {
  return forumSeedingComplete;
}
