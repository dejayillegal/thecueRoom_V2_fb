
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sources } from '../packages/db/schema';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client, { schema: { sources } });

async function populateSources() {
  try {
    console.log('Loading sources from data/sources.json...');
    
    const sourcesPath = path.join(process.cwd(), 'data', 'sources.json');
    const sourcesData = JSON.parse(fs.readFileSync(sourcesPath, 'utf-8'));
    
    let added = 0;
    let skipped = 0;
    
    for (const source of sourcesData) {
      // Check if source already exists
      const existing = await db
        .select()
        .from(sources)
        .where(eq(sources.url, source.url))
        .limit(1);
      
      if (existing.length > 0) {
        console.log(`  Skipping ${source.name} (already exists)`);
        skipped++;
        continue;
      }
      
      await db.insert(sources).values({
        name: source.name,
        url: source.url,
        kind: source.kind,
        tags: source.tags || [],
        config: source.kind === 'scrape' ? {
          list: source.list,
          title: source.title,
          link: source.link,
          image: source.image,
          summary: source.summary,
          date: source.date,
        } : null,
        enabled: true,
      });
      
      console.log(`  ✓ Added ${source.name}`);
      added++;
    }
    
    console.log(`\n✓ Complete: ${added} added, ${skipped} skipped`);
    
  } catch (error) {
    console.error('Error populating sources:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

populateSources();
