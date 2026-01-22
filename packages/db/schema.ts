import { pgTable, text, timestamp, varchar, serial, integer } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// SINGLE SOURCE OF TRUTH: One table only.
export const feeds = pgTable('feeds', {
  id: serial('id').primaryKey(),
  source: text('source').notNull(),
  title: text('title').notNull(),
  summary: text('summary'),
  url: varchar('url', { length: 2048 }).notNull().unique(),
  thumbnail: text('thumbnail').notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
