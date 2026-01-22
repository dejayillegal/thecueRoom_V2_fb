import { pgTable, text, timestamp, jsonb, integer, boolean, uuid, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Users table (Standardized Identity)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash'),
  role: text('role').notNull().default('user'), 
  trustLevel: integer('trust_level').notNull().default(0),
  riskScore: integer('risk_score').notNull().default(0),
  verified: boolean('verified').notNull().default(false),
  verificationStatus: text('verification_status').notNull().default('pending'),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  lastDeviceHash: text('last_device_hash'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Profiles table
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  displayName: text('display_name'),
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

// Artist Profiles
export const artistProfiles = pgTable('artist_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  artistName: text('artist_name').notNull(),
  primarySocialUrl: text('primary_social_url'),
  verificationStatus: text('verification_status').notNull().default('unverified'),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// WebAuthn Credentials (Phase 5 - Prepared)
export const userCredentials = pgTable('user_credentials', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  credentialId: text('credential_id').notNull().unique(),
  publicKey: text('public_key').notNull(),
  counter: integer('counter').notNull().default(0),
  authenticatorType: text('authenticator_type'), // 'platform' | 'cross-platform'
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Auth Events (Security Audit)
export const authEvents = pgTable('auth_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  eventType: text('event_type').notNull(), 
  deviceHash: text('device_hash'),
  riskScore: integer('risk_score'),
  metadata: jsonb('metadata').$type<any>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userEventsIdx: index('auth_events_user_idx').on(table.userId),
  typeIdx: index('auth_events_type_idx').on(table.eventType),
}));

// Authoritative Feed Sources
export const feedsSources = pgTable('feeds_sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  url: text('url').notNull().unique(),
  kind: text('kind').notNull(),
  tags: jsonb('tags').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  config: jsonb('config').$type<any>().default(sql`'{}'::jsonb`),
  enabled: boolean('enabled').notNull().default(true),
  minIntervalMinutes: integer('min_interval_minutes').notNull().default(60),
  lastFetchedAt: timestamp('last_fetched_at', { withTimezone: true }),
  consecutiveFailures: integer('consecutive_failures').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Authoritative Feeds State
export const feedsState = pgTable('feeds_state', {
  sourceId: uuid('source_id').primaryKey().references(() => feedsSources.id, { onDelete: 'cascade' }),
  lastPolledAt: timestamp('last_polled_at', { withTimezone: true }),
  nextPollAt: timestamp('next_poll_at', { withTimezone: true }).notNull().defaultNow(),
  leaseOwner: text('lease_owner'),
  leaseExpiresAt: timestamp('lease_expires_at', { withTimezone: true }),
  status: text('status').notNull().default('idle'),
  lastError: text('last_error'),
  etag: text('etag'),
  lastModified: text('last_modified'),
  consecutiveFailures: integer('consecutive_failures').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  nextPollIdx: index('feeds_state_next_poll_idx').on(table.nextPollAt),
  leaseExpiryIdx: index('feeds_state_lease_expiry_idx').on(table.leaseExpiresAt),
}));

// Authoritative Feed Items
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

// Verification Jobs
export const verificationJobs = pgTable('verification_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  profileUrl: text('profile_url').notNull(),
  status: text('status').notNull().default('queued'),
  progress: integer('progress').notNull().default(0),
  decision: text('decision'),
  score: integer('score'),
  evidence: jsonb('evidence'),
  error: text('error'),
  reviewNotes: text('review_notes'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Notifications
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  link: text('link'),
  read: boolean('read').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Feed Ingestion Logs
export const feedsIngestionLog = pgTable('feeds_ingestion_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourceId: uuid('source_id').references(() => feedsSources.id, { onDelete: 'cascade' }),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  status: text('status').notNull(),
  itemsProcessed: integer('items_processed').default(0),
  itemsNew: integer('items_new').default(0),
  errorMessage: text('error_message'),
});
