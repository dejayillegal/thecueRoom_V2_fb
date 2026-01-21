import { db } from './index';
import { feedsSources, feedsState } from './schema';
import { eq } from 'drizzle-orm';

/**
 * Ensures that when a new source is added, it also has an associated feeds_state
 * and is set to poll immediately.
 */
export async function ensureSourceState(sourceId: string) {
  try {
    const existing = await db
      .select()
      .from(feedsState)
      .where(eq(feedsState.sourceId, sourceId))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(feedsState).values({
        sourceId,
        nextPollAt: new Date(), // Poll immediately
        status: 'idle',
        consecutiveFailures: 0,
        updatedAt: new Date(),
      });
      console.log(`[Ingestion] Created initial state for source ${sourceId}`);
    }
  } catch (err) {
    console.error(`[Ingestion] Failed to ensure source state for ${sourceId}:`, err);
  }
}

/**
 * Seeds initial sources and ensures their states.
 */
export async function seedSources() {
  const initialSources = [
    {
      name: 'Pitchfork',
      url: 'https://pitchfork.com/feed/feed-news/rss',
      kind: 'rss',
      tags: ['news', 'indie', 'reviews']
    },
    {
      name: 'Resident Advisor',
      url: 'https://ra.co/xml/news.xml',
      kind: 'rss',
      tags: ['electronic', 'techno', 'house']
    }
  ];

  for (const s of initialSources) {
    try {
      const inserted = await db
        .insert(feedsSources)
        .values({
          name: s.name,
          url: s.url,
          kind: s.kind,
          tags: s.tags,
          enabled: true,
          minIntervalMinutes: 60,
          updatedAt: new Date(),
        })
        .onConflictDoNothing({ target: feedsSources.url })
        .returning();

      if (inserted.length > 0) {
        await ensureSourceState(inserted[0].id);
      }
    } catch (err) {
      console.error(`[Ingestion] Failed to seed source ${s.name}:`, err);
    }
  }
}
