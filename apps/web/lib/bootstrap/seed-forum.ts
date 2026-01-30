import { getDbClient } from '@thecueroom/db/client';
import { sql } from 'drizzle-orm';

interface ForumCategory { name: string; slug: string; description: string; }
interface ForumThread { categorySlug: string; title: string; slug: string; body: string; tags: string[]; isPinned?: boolean; }

const FORUM_CATEGORIES: ForumCategory[] = [
  { name: 'General Discussion', slug: 'general', description: 'Open discussions about music.' },
  { name: 'Production Tips', slug: 'production', description: 'Discover production techniques.' },
  { name: 'Collaborations', slug: 'collaborations', description: 'Find collaborators.' },
  { name: 'Industry News', slug: 'industry-news', description: 'Discuss industry trends.' },
  { name: 'Feedback & Reviews', slug: 'feedback', description: 'Get constructive feedback.' }
];

const FORUM_THREADS: ForumThread[] = [
  { categorySlug: 'general', title: 'Welcome to thecueRoom!', slug: 'welcome', body: 'Welcome to the community!', tags: ['welcome'], isPinned: true },
  { categorySlug: 'production', title: 'Essential Plugins', slug: 'plugins', body: 'Share your favorite tools.', tags: ['plugins'] },
  { categorySlug: 'industry-news', title: 'AI in Music', slug: 'ai-future', body: 'Threat or opportunity?', tags: ['ai'] }
];

let forumSeedingComplete = false;
let forumSeedingAttempted = false;

export async function ensureForumContent(): Promise<{ success: boolean; message: string }> {
  if (forumSeedingComplete) return { success: true, message: 'Forum seeded' };
  if (forumSeedingAttempted) return { success: false, message: 'Attempted' };

  forumSeedingAttempted = true;
  try {
    const db = getDbClient();
    const tableCheck = await db.execute(sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'forum_categories') as exists`);
    if (!(tableCheck.rows?.[0] as any)?.exists) {
      console.log('[Bootstrap] Forum tables missing. Skipping seeding.');
      return { success: false, message: 'Forum tables missing' };
    }

    const catMap: Record<string, string> = {};
    for (const cat of FORUM_CATEGORIES) {
      const existing = await db.execute(sql`SELECT id FROM forum_categories WHERE slug = ${cat.slug} LIMIT 1`);
      if (existing.rows?.[0]) catMap[cat.slug] = (existing.rows[0] as any).id;
      else {
        const res = await db.execute(sql`INSERT INTO forum_categories (name, slug, description, thread_count, created_at) VALUES (${cat.name}, ${cat.slug}, ${cat.description}, 0, NOW()) RETURNING id`);
        if (res.rows?.[0]) catMap[cat.slug] = (res.rows[0] as any).id;
      }
    }

    const admin = await db.execute(sql`SELECT id FROM users WHERE role = 'admin' LIMIT 1`);
    if (!admin.rows?.[0]) return { success: true, message: 'No admin for threads' };
    const adminId = (admin.rows[0] as any).id;

    for (const thread of FORUM_THREADS) {
      const cid = catMap[thread.categorySlug];
      if (!cid) continue;
      const existing = await db.execute(sql`SELECT id FROM forum_threads WHERE slug = ${thread.slug} LIMIT 1`);
      if (existing.rows?.length > 0) continue;

      await db.execute(sql`INSERT INTO forum_threads (user_id, category_id, title, slug, body, tags, is_pinned, moderation_status, created_at, updated_at) VALUES (${adminId}::uuid, ${cid}::uuid, ${thread.title}, ${thread.slug}, ${thread.body}, ${JSON.stringify(thread.tags)}::jsonb, ${thread.isPinned || false}, 'approved', NOW(), NOW())`);
    }

    forumSeedingComplete = true;
    return { success: true, message: 'Seeded' };
  } catch (error: any) {
    console.error('Forum seed fail:', error);
    return { success: false, message: error.message };
  }
}
