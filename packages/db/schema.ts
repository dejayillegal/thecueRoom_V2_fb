import { pgTable, text, timestamp, jsonb, integer, boolean, uuid, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Users table for references
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash'),
  role: text('role').notNull().default('user'),
  verified: boolean('verified').notNull().default(false),
  verificationStatus: text('verification_status').notNull().default('pending'),
  verificationJobId: uuid('verification_job_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
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
  region: text('region'),
  genre: text('genre'),
  socialLinks: jsonb('social_links').$type<Record<string, string>>(),
  aiCredits: integer('ai_credits').notNull().default(100),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
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
  lastFetchedAt: timestamp('last_fetched_at', { withTimezone: true }),
  consecutiveFailures: integer('consecutive_failures').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Authoritative Feeds State (Lease Locking & Scheduling)
export const feedsState = pgTable('feeds_state', {
  sourceId: uuid('source_id').primaryKey().references(() => feedsSources.id, { onDelete: 'cascade' }),
  lastPolledAt: timestamp('last_polled_at', { withTimezone: true }),
  nextPollAt: timestamp('next_poll_at', { withTimezone: true }).notNull().defaultNow(),
  leaseOwner: text('lease_owner'),
  leaseExpiresAt: timestamp('lease_expires_at', { withTimezone: true }),
  status: text('status').notNull().default('idle'), // 'idle' | 'ingesting' | 'healthy' | 'error'
  lastError: text('last_error'),
  etag: text('etag'),
  lastModified: text('last_modified'),
  consecutiveFailures: integer('consecutive_failures').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
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
  summary: text('summary').notNull().default(''),
  content: text('content').notNull().default(''),
  link: text('link').notNull(),
  image: text('image').notNull().default(''),
  tags: jsonb('tags').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  rawData: jsonb('raw_data').$type<any>().notNull().default(sql`'{}'::jsonb`),
  publishedAt: timestamp('published_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  contentHash: text('content_hash').notNull().unique(),
}, (table) => ({
  sourceExternalIdx: uniqueIndex('feeds_items_source_external_idx').on(table.sourceId, table.externalId),
  publishedAtIdx: index('feeds_items_published_at_idx').on(table.publishedAt),
  contentHashIdx: uniqueIndex('feeds_items_content_hash_idx').on(table.contentHash),
}));

// Authoritative Ingestion Logging
export const feedsIngestionLog = pgTable('feeds_ingestion_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourceId: uuid('source_id').notNull().references(() => feedsSources.id, { onDelete: 'cascade' }),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  status: text('status').notNull(), // 'success' | 'failed' | 'partial'
  itemsProcessed: integer('items_processed').notNull().default(0),
  itemsNew: integer('items_new').notNull().default(0),
  errorMessage: text('error_message'),
  trace: jsonb('trace').$type<any>(),
}, (table) => ({
  sourceStartedIdx: index('feeds_ingestion_log_source_started_idx').on(table.sourceId, table.startedAt),
}));

// Verification Jobs Table
export const verificationJobs = pgTable('verification_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  profileUrl: text('profile_url').notNull(),
  status: text('status').notNull().default('queued'), // 'queued' | 'processing' | 'completed' | 'failed'
  decision: text('decision'), // 'approved' | 'rejected' | 'review'
  score: integer('score'),
  evidence: jsonb('evidence').$type<any>(),
  error: text('error'),
  reviewNotes: text('review_notes'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
