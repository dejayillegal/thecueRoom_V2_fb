
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import Parser from 'rss-parser';
import { feeds, sources } from '../packages/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client, { schema: { feeds, sources } });
const parser = new Parser({
  timeout: 15000,
  headers: {
    'User-Agent': 'thecueRoom/2.0',
  },
});

function generateHash(title: string, link: string): string {
  return crypto
    .createHash('sha256')
    .update(`${title}|${link}`)
    .digest('hex');
}

function extractImage(item: any, baseUrl: string): string {
  if (item.enclosure?.url) return item.enclosure.url;
  if (item['media:content']?.$ ?.url) return item['media:content'].$.url;
  if (item['media:thumbnail']?.$?.url) return item['media:thumbnail'].$.url;
  
  const content = item.content || item['content:encoded'] || '';
  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch) {
    const src = imgMatch[1];
    return src.startsWith('http') ? src : new URL(src, baseUrl).href;
  }
  
  return '';
}

function cleanText(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

async function ingestSource(source: any) {
  try {
    console.log(`Ingesting: ${source.name}`);
    
    const feed = await parser.parseURL(source.url);
    const baseUrl = new URL(source.url).origin;
    
    let imported = 0;
    let skipped = 0;

    for (const item of feed.items.slice(0, 20)) {
      if (!item.title || !item.link) continue;

      const hash = generateHash(item.title, item.link);
      
      const existing = await db
        .select()
        .from(feeds)
        .where(eq(feeds.contentHash, hash))
        .limit(1);

      if (existing.length > 0) {
        skipped++;
        continue;
      }

      const image = extractImage(item, baseUrl);
      const summary = cleanText(item.contentSnippet || item.summary || '').slice(0, 500);
      const publishedAt = item.isoDate || item.pubDate || new Date().toISOString();

      await db.insert(feeds).values({
        sourceId: source.id,
        title: item.title.trim(),
        summary,
        link: item.link,
        image: image || null,
        content: item.content || null,
        tags: source.tags || [],
        publishedAt: new Date(publishedAt),
        contentHash: hash,
      });

      imported++;
    }

    console.log(`✓ ${source.name}: ${imported} new, ${skipped} skipped`);
  } catch (error: any) {
    console.error(`✗ ${source.name}: ${error.message}`);
  }
}

async function main() {
  console.log('Starting feed ingestion...\n');

  const allSources = await db.select().from(sources);
  
  if (allSources.length === 0) {
    console.log('No sources found in database. Please add sources first.');
    return;
  }

  for (const source of allSources) {
    await ingestSource(source);
  }

  console.log('\n✓ Ingestion complete');
  await client.end();
}

// Allow running as script or importing as module
const isMainModule = typeof require !== 'undefined' && require.main === module;

if (isMainModule) {
  main().catch(console.error);
}

export { main as ingestFeeds };
