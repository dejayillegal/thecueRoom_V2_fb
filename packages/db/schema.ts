import { pgTable, text, timestamp, jsonb, integer, boolean, uuid, index, uniqueIndex, varchar, numeric, primaryKey } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Users table for references
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash'),
  role: text('role').notNull().default('user'),
  verified: boolean('verified').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Profiles table
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  displayName: text('display_name'),
  artistName: text('artist_name'),
  firstName: text('first_name'),
  lastName: text('last_name'),
  bio: text('bio'),
  avatar: text('avatar'),
  phone: text('phone'),
  region: varchar('region', { length: 60 }),
  genre: varchar('genre', { length: 120 }),
  socialLinks: jsonb('social_links').$type<Record<string, string>>(),
  aiCredits: integer('ai_credits').notNull().default(100),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Authoritative Feed Sources
export const feedsSources = pgTable('feeds_sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  url: text('url').notNull().unique(),
  kind: text('kind').notNull(), // 'rss' | 'json' | 'atom'
  tags: jsonb('tags').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  config: jsonb('config').$type<any>().default(sql`'{}'::jsonb`),
  enabled: boolean('enabled').notNull().default(true),
  minIntervalMinutes: integer('min_interval_minutes').notNull().default(60),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Authoritative Feeds State (Lease Locking & Scheduling)
export const feedsState = pgTable('feeds_state', {
  sourceId: uuid('source_id').primaryKey().references(() => feedsSources.id, { onDelete: 'cascade' }),
  lastPolledAt: timestamp('last_polled_at'),
  nextPollAt: timestamp('next_poll_at').notNull().defaultNow(),
  leaseOwner: text('lease_owner'),
  leaseExpiresAt: timestamp('lease_expires_at'),
  status: text('status').notNull().default('idle'), // 'idle' | 'ingesting' | 'healthy' | 'error'
  lastError: text('last_error'),
  etag: text('etag'),
  lastModified: text('last_modified'),
  consecutiveFailures: integer('consecutive_failures').notNull().default(0),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  nextPollIdx: index('feeds_state_next_poll_idx').on(table.nextPollAt),
  leaseExpiryIdx: index('feeds_state_lease_expiry_idx').on(table.leaseExpiresAt),
}));

// Authoritative Feed Items (Idempotent Storage)
export const feedsItems = pgTable('feeds_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourceId: uuid('source_id').notNull().references(() => feedsSources.id, { onDelete: 'cascade' }),
  externalId: text('external_id').notNull(),
  title: text('title').notNull(),
  summary: text('summary'),
  content: text('content'),
  link: text('link').notNull(),
  image: text('image'),
  tags: jsonb('tags').$type<string[]>().default(sql`'[]'::jsonb`),
  rawData: jsonb('raw_data').$type<any>(),
  publishedAt: timestamp('published_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  sourceExternalIdx: uniqueIndex('feeds_items_source_external_idx').on(table.sourceId, table.externalId),
  publishedAtIdx: index('feeds_items_published_at_idx').on(table.publishedAt),
}));

// Authoritative Ingestion Logging
export const feedsIngestionLog = pgTable('feeds_ingestion_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourceId: uuid('source_id').notNull().references(() => feedsSources.id, { onDelete: 'cascade' }),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  finishedAt: timestamp('finished_at'),
  status: text('status').notNull(), // 'success' | 'failed' | 'partial'
  itemsProcessed: integer('items_processed').notNull().default(0),
  itemsNew: integer('items_new').notNull().default(0),
  errorMessage: text('error_message'),
  trace: jsonb('trace').$type<any>(),
}, (table) => ({
  sourceStartedIdx: index('feeds_ingestion_log_source_started_idx').on(table.sourceId, table.startedAt),
}));
