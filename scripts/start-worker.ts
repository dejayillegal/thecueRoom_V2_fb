import { getDbClient } from '../packages/db/client';
import { sql } from 'drizzle-orm';
import { feedsItems, feedsSources } from '../packages/db/schema';
import { eq, sql } from 'drizzle-orm';
import Parser from 'rss-parser';
import pLimit from 'p-limit';
import crypto from 'crypto';

const parser = new Parser({ timeout: 30000 });
const limit = pLimit(5);

function generateHash(title: string, link: string): string {
  return crypto.createHash('sha256').update(`${title}|${link}`).digest('hex');
}

async function processFeed(source: any) {
  const db = getDbClient();
  try {
    const feed = await parser.parseURL(source.url);
    for (const item of feed.items || []) {
      if (!item.link || !item.title) continue;
      const hash = generateHash(item.title, item.link);
      const existing = await db.select().from(feedsItems).where(eq(feedsItems.contentHash, hash)).limit(1);
      if (existing.length > 0) continue;

      const publishedAt = item.isoDate ? new Date(item.isoDate) : new Date();
      await db.insert(feedsItems).values({
        sourceId: source.id,
        externalId: hash,
        title: item.title,
        summary: item.contentSnippet?.slice(0, 500) || '',
        content: item.content?.slice(0, 5000) || '',
        link: item.link,
        image: item.enclosure?.url || '',
        tags: [],
        contentHash: hash,
        publishedAt: isNaN(publishedAt.getTime()) ? new Date() : publishedAt,
      });
    }
    await db.update(feedsSources).set({ lastFetchedAt: new Date(), consecutiveFailures: 0 }).where(eq(feedsSources.id, source.id));
  } catch (error: any) {
    await db.update(feedsSources).set({ consecutiveFailures: sql`${feedsSources.consecutiveFailures} + 1`, lastFetchedAt: new Date() }).where(eq(feedsSources.id, source.id));
  }
}

async function run() {
  const db = getDbClient();
  const enabledSources = await db.select().from(feedsSources).where(eq(feedsSources.enabled, true));
  await Promise.all(enabledSources.map(s => limit(() => processFeed(s))));
}

run().catch(console.error);
