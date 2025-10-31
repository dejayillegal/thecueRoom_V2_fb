import { pgTable, text, timestamp, jsonb, integer, boolean, uuid, index, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash'),
  role: text('role').notNull().default('user'),
  verified: boolean('verified').notNull().default(false),
  verificationJobId: uuid('verification_job_id'),
  verificationStatus: text('verification_status').default('pending'),
  verificationNotes: text('verification_notes'),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  displayName: text('display_name'),
  firstName: text('first_name'),
  lastName: text('last_name'),
  bio: text('bio'),
  avatar: text('avatar'),
  phone: text('phone'),
  region: varchar('region', { length: 60 }),
  genre: varchar('genre', { length: 120 }),
  socialLinks: jsonb('social_links').$type<Record<string, string>>(),
  socialProfileUrl: text('social_profile_url'),
  aiCredits: integer('ai_credits').notNull().default(100),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const sources = pgTable('sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  url: text('url').notNull().unique(),
  kind: text('kind').notNull(),
  tags: jsonb('tags').$type<string[]>().notNull(),
  config: jsonb('config').$type<any>(),
  enabled: boolean('enabled').notNull().default(true),
  lastFetchedAt: timestamp('last_fetched_at'),
  lastSuccessAt: timestamp('last_success_at'),
  etag: text('etag'),
  lastModified: text('last_modified'),
  consecutiveFailures: integer('consecutive_failures').notNull().default(0),
  lastStatusCode: integer('last_status_code'),
  circuitOpenUntil: timestamp('circuit_open_until'),
  minIntervalMs: integer('min_interval_ms').notNull().default(600000),
  averageFetchTime: integer('average_fetch_time'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const feeds = pgTable('feeds', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourceId: uuid('source_id').notNull().references(() => sources.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  summary: text('summary'),
  content: text('content'),
  link: text('link').notNull().unique(),
  image: text('image'),
  tags: text('tags').array(),
  contentHash: text('content_hash').notNull().unique(),
  rawData: jsonb('raw_data').$type<any>(),
  publishedAt: timestamp('published_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  publishedAtIdx: index('feeds_published_at_idx').on(table.publishedAt),
  sourceIdIdx: index('feeds_source_id_idx').on(table.sourceId),
  contentHashIdx: index('feeds_content_hash_idx').on(table.contentHash),
}));

export const fetchLogs = pgTable('fetch_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourceId: uuid('source_id').notNull().references(() => sources.id, { onDelete: 'cascade' }),
  startedAt: timestamp('started_at').notNull(),
  finishedAt: timestamp('finished_at'),
  status: text('status').notNull(),
  httpStatus: integer('http_status'),
  itemsProcessed: integer('items_processed').notNull().default(0),
  itemsNew: integer('items_new').notNull().default(0),
  errorMessage: text('error_message'),
}, (table) => ({
  sourceIdIdx: index('fetch_logs_source_id_idx').on(table.sourceId),
  startedAtIdx: index('fetch_logs_started_at_idx').on(table.startedAt),
}));

export const spotlightItems = pgTable('spotlight_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  excerpt: text('excerpt'),
  content: text('content'),
  image: text('image').notNull(),
  link: text('link'),
  category: text('category').notNull(),
  featured: boolean('featured').notNull().default(false),
  publishedAt: timestamp('published_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const playlists = pgTable('playlists', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  soundcloudUrl: text('soundcloud_url'),
  embedHtml: text('embed_html'),
  thumbnail: text('thumbnail'),
  weekOf: timestamp('week_of').notNull(),
  featured: boolean('featured').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const gigs = pgTable('gigs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  venue: text('venue').notNull(),
  location: text('location').notNull(),
  lat: text('lat'),
  lng: text('lng'),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  isPrivate: boolean('is_private').notNull().default(false),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  startTimeIdx: index('gigs_start_time_idx').on(table.startTime),
  userIdIdx: index('gigs_user_id_idx').on(table.userId),
}));

export const epks = pgTable('epks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  bio: text('bio').notNull(),
  discography: jsonb('discography').$type<any[]>(),
  pressQuotes: jsonb('press_quotes').$type<string[]>(),
  images: jsonb('images').$type<string[]>(),
  pdfUrl: text('pdf_url'),
  publicUrl: text('public_url').unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('epks_user_id_idx').on(table.userId),
  publicUrlIdx: index('epks_public_url_idx').on(table.publicUrl),
}));

export const memes = pgTable('memes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  template: text('template').notNull(),
  textTop: text('text_top'),
  textBottom: text('text_bottom'),
  imageUrl: text('image_url').notNull(),
  upvotes: integer('upvotes').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('memes_user_id_idx').on(table.userId),
  createdAtIdx: index('memes_created_at_idx').on(table.createdAt),
}));

export const tickets = pgTable('tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: text('ticket_id').notNull().unique(),
  eventSlug: text('event_slug').notNull(),
  userId: uuid('user_id').references(() => users.id),
  holderName: text('holder_name'),
  holderEmail: text('holder_email'),
  seat: text('seat'),
  issuedAt: timestamp('issued_at').defaultNow().notNull(),
  verified: boolean('verified').default(false),
  signature: text('signature').notNull(),
  qrUrl: text('qr_url'),
  pdfUrl: text('pdf_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const forumCategories = pgTable('forum_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const forumThreads = pgTable('forum_threads', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id').references(() => forumCategories.id),
  userId: uuid('user_id').references(() => users.id),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  content: text('content').notNull(),
  tags: jsonb('tags').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  isPinned: boolean('is_pinned').default(false),
  isLocked: boolean('is_locked').default(false),
  viewCount: integer('view_count').default(0),
  replyCount: integer('reply_count').default(0),
  upvotes: integer('upvotes').default(0),
  commentCount: integer('comment_count').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  createdAtIdx: index('forum_threads_created_at_idx').on(table.createdAt),
  upvotesIdx: index('forum_threads_upvotes_idx').on(table.upvotes),
}));

export const forumPosts = pgTable('forum_posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  threadId: uuid('thread_id').references(() => forumThreads.id),
  userId: uuid('user_id').references(() => users.id),
  content: text('content').notNull(),
  imageUrl: text('image_url'),
  upvotes: integer('upvotes').default(0),
  isFlagged: boolean('is_flagged').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  threadIdIdx: index('forum_posts_thread_id_idx').on(table.threadId),
  createdAtIdx: index('forum_posts_created_at_idx').on(table.createdAt),
}));

export const aiJobs = pgTable('ai_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  prompt: text('prompt').notNull(),
  params: jsonb('params').$type<any>(),
  status: text('status').notNull().default('pending'),
  progress: integer('progress').notNull().default(0),
  resultUrl: text('result_url'),
  error: text('error'),
  retryCount: integer('retry_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
}, (table) => ({
  statusIdx: index('ai_jobs_status_idx').on(table.status),
  userIdIdx: index('ai_jobs_user_id_idx').on(table.userId),
  createdAtIdx: index('ai_jobs_created_at_idx').on(table.createdAt),
}));

export const assets = pgTable('assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  url: text('url').notNull(),
  filename: text('filename').notNull(),
  size: integer('size'),
  checksum: text('checksum'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const ingestionJobs = pgTable('ingestion_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourceId: uuid('source_id').notNull().references(() => sources.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('pending'),
  itemsProcessed: integer('items_processed').notNull().default(0),
  itemsNew: integer('items_new').notNull().default(0),
  error: text('error'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  statusIdx: index('ingestion_jobs_status_idx').on(table.status),
  createdAtIdx: index('ingestion_jobs_created_at_idx').on(table.createdAt),
}));

export const verificationJobs = pgTable('verification_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  profileUrl: text('profile_url').notNull(),
  status: text('status').notNull().default('queued'),
  decision: text('decision'),
  score: integer('score'),
  evidence: jsonb('evidence').$type<any>(),
  error: text('error'),
  reviewedBy: text('reviewed_by'),
  reviewNotes: text('review_notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
}, (table) => ({
  statusIdx: index('verification_jobs_status_idx').on(table.status),
  userIdIdx: index('verification_jobs_user_id_idx').on(table.userId),
  createdAtIdx: index('verification_jobs_created_at_idx').on(table.createdAt),
}));