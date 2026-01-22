import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// SINGLE SOURCE OF TRUTH: One table only.
export const feeds = pgTable('feeds', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  source: text('source').notNull(),
  title: text('title').notNull(),
  summary: text('summary'),
  url: varchar('url', { length: 2048 }).notNull().unique(),
  thumbnailUrl: text('thumbnail_url'),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
