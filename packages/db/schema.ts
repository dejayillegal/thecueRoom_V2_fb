import { pgTable, text, timestamp, varchar, serial, integer, uuid, boolean, jsonb } from 'drizzle-orm/pg-core';
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

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash'),
  role: text('role').notNull().default('user'),
  verified: boolean('verified').default(false),
  verificationStatus: text('verification_status').default('pending'),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  firstName: text('first_name'),
  lastName: text('last_name'),
  displayName: text('display_name'),
  artistName: text('artist_name'),
  bio: text('bio'),
  region: text('region'),
  genre: text('genre'),
  socialProfileUrl: text('social_profile_url'),
  socialLinks: jsonb('social_links').default({}),
  aiCredits: integer('ai_credits').default(0),
  showEmail: boolean('show_email').default(false),
  showPhone: boolean('show_phone').default(false),
  publicReleases: boolean('public_releases').default(true),
  allowContactRequests: boolean('allow_contact_requests').default(true),
  avatarSeed: text('avatar_seed'),
  avatarType: text('avatar_type').default('generated'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const loginAttempts = pgTable('login_attempts', {
  id: serial('id').primaryKey(),
  identifier: text('identifier').notNull().unique(),
  attempts: integer('attempts').notNull().default(0),
  lastAttemptAt: timestamp('last_attempt_at').notNull().defaultNow(),
  blockedUntil: timestamp('blocked_until'),
});

export const forumCategories = pgTable('forum_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  threadCount: integer('thread_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const forumThreads = pgTable('forum_threads', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  categoryId: uuid('category_id').notNull().references(() => forumCategories.id),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  body: text('body').notNull(),
  tags: jsonb('tags').default([]),
  viewCount: integer('view_count').default(0),
  replyCount: integer('reply_count').default(0),
  likesCount: integer('likes_count').default(0),
  isPinned: boolean('is_pinned').default(false),
  embedLinks: jsonb('embed_links').default([]),
  moderationStatus: text('moderation_status').default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const threadLikes = pgTable('thread_likes', {
  id: uuid('id').primaryKey().defaultRandom(),
  threadId: uuid('thread_id').notNull().references(() => forumThreads.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const forumReplies = pgTable('forum_replies', {
  id: uuid('id').primaryKey().defaultRandom(),
  threadId: uuid('thread_id').notNull().references(() => forumThreads.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  body: text('body').notNull(),
  likesCount: integer('likes_count').default(0),
  moderationStatus: text('moderation_status').default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const userReputation = pgTable('user_reputation', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  karmaPoints: integer('karma_points').default(0),
  badges: jsonb('badges').default([]),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const verificationJobs = pgTable('verification_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  profileUrl: text('profile_url').notNull(),
  status: text('status').notNull().default('queued'),
  progress: integer('progress').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const feedsSources = pgTable('feeds_sources', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  url: text('url').notNull().unique(),
  kind: text('kind').notNull().default('rss'),
  enabled: boolean('enabled').default(true),
  lastFetchedAt: timestamp('last_fetched_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const feedsItems = pgTable('feeds_items', {
  id: serial('id').primaryKey(),
  sourceId: integer('source_id').references(() => feedsSources.id),
  externalId: text('external_id').notNull().unique(),
  title: text('title').notNull(),
  summary: text('summary'),
  content: text('content'),
  link: text('link').notNull(),
  image: text('image'),
  tags: jsonb('tags').default([]),
  publishedAt: timestamp('published_at'),
  contentHash: text('content_hash').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  type: text('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  link: text('link'),
  read: boolean('read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const gigs = pgTable('gigs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  description: text('description'),
  venue: text('venue').notNull(),
  location: text('location').notNull(),
  city: text('city'),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  ticketUrl: text('ticket_url'),
  genres: jsonb('genres').default([]),
  approved: boolean('approved').default(false),
  visibility: text('visibility').default('public'),
  status: text('status').default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const spotlightItems = pgTable('spotlight_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  excerpt: text('excerpt'),
  content: text('content'),
  image: text('image').notNull(),
  link: text('link'),
  category: text('category').notNull(),
  featured: boolean('featured').default(false),
  publishedAt: timestamp('published_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const playlists = pgTable('playlists', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  platform: text('platform'),
  platformId: text('platform_id'),
  embedUrl: text('embed_url'),
  soundcloudUrl: text('soundcloud_url'),
  monthOf: timestamp('month_of'),
  featured: boolean('featured').default(false),
  visibility: text('visibility').default('public'),
  status: text('status').default('draft'),
  curatedAt: timestamp('curated_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const memes = pgTable('memes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  template: text('template').notNull(),
  textTop: text('text_top'),
  textBottom: text('text_bottom'),
  imageUrl: text('image_url').notNull(),
  upvotes: integer('upvotes').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});
