import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import Parser from 'rss-parser';
import { sql } from 'drizzle-orm';
import { feedsItems, feedsSources } from '../packages/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { seedSources } from './seed-sources';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

const parser = new Parser({
  timeout: 30000,
  headers: {
    'User-Agent': 'thecueRoom/2.0 Feed Aggregator (contact@thecueroom.com)',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
  },
});

function generateHash(title: string, link: string): string {
  return crypto.createHash('sha256').update(`${title}|${link}`).digest('hex');
}

function extractImage(item: any, baseUrl: string): string | null {
  try {
    if (item.enclosure?.url) return item.enclosure.url;
    if (item['media:content']?.$?.url) return item['media:content'].$.url;
    if (item['media:thumbnail']?.$?.url) return item['media:thumbnail'].$.url;
    if (item.image?.url) return item.image.url;
    const content = item.content || item['content:encoded'] || item.description || '';
    const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch && imgMatch[1]) {
      const src = imgMatch[1];
      return src.startsWith('http') ? src : new URL(src, baseUrl).href;
    }
    return null;
  } catch { return null; }
}

function cleanText(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

async function ingestSource(source: any) {
  try {
    console.log(`📥 Fetching: ${source.name}`);
    const feed = await parser.parseURL(source.url);
    const baseUrl = new URL(source.url).origin;

    for (const item of feed.items.slice(0, 20)) {
      if (!item.title || !item.link) continue;
      const hash = generateHash(item.title, item.link);
      
      const existing = await db.select().from(feedsItems).where(eq(feedsItems.contentHash, hash)).limit(1);
      if (existing.length > 0) continue;

      const publishedAt = item.isoDate ? new Date(item.isoDate) : new Date();

      await db.insert(feedsItems).values({
        sourceId: source.id,
        externalId: hash,
        title: item.title.trim().slice(0, 500),
        summary: cleanText(item.contentSnippet || '').slice(0, 500),
        content: cleanText(item.content || '').slice(0, 5000),
        link: item.link,
        image: extractImage(item, baseUrl) || '',
        tags: [],
        publishedAt: isNaN(publishedAt.getTime()) ? new Date() : publishedAt,
        contentHash: hash,
      });
    }
    await db.update(feedsSources).set({ lastFetchedAt: new Date() }).where(eq(feedsSources.id, source.id));
    console.log(`✅ ${source.name} complete`);
  } catch (error: any) {
    console.error(`❌ ${source.name}: ${error.message}`);
  }
}

async function main() {
  await seedSources();
  const allSources = await db.select().from(feedsSources).where(eq(feedsSources.enabled, true));
  for (const source of allSources) {
    await ingestSource(source);
  }
  await client.end();
}

main().catch(console.error);
