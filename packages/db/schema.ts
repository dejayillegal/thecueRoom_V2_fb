import { pgTable, text, timestamp, jsonb, integer, boolean, uuid, index, uniqueIndex, varchar, numeric } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash'),
  role: text('role').notNull().default('user'), // 'admin' | 'artist' | 'user'
  verified: boolean('verified').notNull().default(false),
  verificationJobId: uuid('verification_job_id'),
  verificationStatus: text('verification_status').default('pending'),
  verificationNotes: text('verification_notes'),
  verificationMethod: text('verification_method'), // 'ai' | 'manual' | 'social'
  verificationMeta: jsonb('verification_meta').$type<any>(),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

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
  socialProfileUrl: text('social_profile_url'),
  aiCredits: integer('ai_credits').notNull().default(100),
  showEmail: boolean('show_email').notNull().default(false),
  showPhone: boolean('show_phone').notNull().default(false),
  publicReleases: boolean('public_releases').notNull().default(true),
  allowContactRequests: boolean('allow_contact_requests').notNull().default(true),
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

export const artistSpotlight = pgTable('artist_spotlight', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  weight: integer('weight').notNull().default(1),
  featuredUntil: timestamp('featured_until'),
  status: text('status').notNull().default('pending'), // 'pending' | 'active' | 'expired'
  requestedAt: timestamp('requested_at').defaultNow().notNull(),
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('artist_spotlight_user_id_idx').on(table.userId),
  statusIdx: index('artist_spotlight_status_idx').on(table.status),
  featuredUntilIdx: index('artist_spotlight_featured_until_idx').on(table.featuredUntil),
}));

export const playlists = pgTable('playlists', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  curatorId: uuid('curator_id').references(() => users.id),
  platform: text('platform'), // 'spotify' | 'soundcloud' | 'beatport' | 'mixcloud' | 'bandcamp' | 'youtube_music' | null for legacy
  platformId: text('platform_id'),
  embedUrl: text('embed_url'),
  soundcloudUrl: text('soundcloud_url'),
  embedHtml: text('embed_html'),
  thumbnail: text('thumbnail'),
  weekOf: timestamp('week_of').notNull(),
  featured: boolean('featured').notNull().default(false),
  visibility: text('visibility').default('public'), // 'admin' | 'featured' | 'public'
  autoCurated: boolean('auto_curated').default(false),
  curatedAt: timestamp('curated_at'),
  status: text('status').default('draft'), // 'draft' | 'queued' | 'live' | 'archived'
  scheduledPublishAt: timestamp('scheduled_publish_at'),
  aiConfidenceScore: integer('ai_confidence_score'),
  metadata: jsonb('metadata').$type<any>().default(sql`'{}'::jsonb`),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  statusIdx: index('playlists_status_idx').on(table.status),
  visibilityIdx: index('playlists_visibility_idx').on(table.visibility),
  curatedAtIdx: index('playlists_curated_at_idx').on(table.curatedAt),
  autoCuratedIdx: index('playlists_auto_curated_idx').on(table.autoCurated),
}));

export const playlistItems = pgTable('playlist_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  playlistId: uuid('playlist_id').notNull().references(() => playlists.id, { onDelete: 'cascade' }),
  trackPlatform: text('track_platform').notNull(),
  trackId: text('track_id').notNull(),
  trackTitle: text('track_title').notNull(),
  artistName: text('artist_name').notNull(),
  trackUrl: text('track_url'),
  previewUrl: text('preview_url'),
  coverImage: text('cover_image'),
  metadata: jsonb('metadata').$type<any>().default(sql`'{}'::jsonb`),
  position: integer('position').notNull(),
  aiScore: integer('ai_score'),
  aiRationale: text('ai_rationale'),
  addedBy: uuid('added_by').references(() => users.id, { onDelete: 'set null' }),
  addedAt: timestamp('added_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  playlistIdIdx: index('playlist_items_playlist_id_idx').on(table.playlistId),
  positionIdx: index('playlist_items_position_idx').on(table.playlistId, table.position),
}));

export const playlistHistory = pgTable('playlist_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  playlistId: uuid('playlist_id').notNull().references(() => playlists.id, { onDelete: 'cascade' }),
  snapshotData: jsonb('snapshot_data').$type<any>().notNull(),
  changedBy: uuid('changed_by').references(() => users.id, { onDelete: 'set null' }),
  changeType: text('change_type').notNull(), // 'created' | 'updated' | 'published' | 'archived'
  changeNotes: text('change_notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  playlistIdIdx: index('playlist_history_playlist_id_idx').on(table.playlistId),
  createdAtIdx: index('playlist_history_created_at_idx').on(table.createdAt),
}));

export const trackSuggestions = pgTable('track_suggestions', {
  id: uuid('id').primaryKey().defaultRandom(),
  artistId: uuid('artist_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  trackPlatform: text('track_platform').notNull(),
  trackUrl: text('track_url').notNull(),
  trackTitle: text('track_title'),
  artistName: text('artist_name'),
  notes: text('notes'),
  metadata: jsonb('metadata').$type<any>().default(sql`'{}'::jsonb`),
  status: text('status').notNull().default('pending'), // 'pending' | 'approved' | 'rejected'
  reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
  reviewedAt: timestamp('reviewed_at'),
  reviewNotes: text('review_notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  artistIdIdx: index('track_suggestions_artist_id_idx').on(table.artistId),
  statusIdx: index('track_suggestions_status_idx').on(table.status),
  createdAtIdx: index('track_suggestions_created_at_idx').on(table.createdAt),
}));

export const gigs = pgTable('gigs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  venue: text('venue').notNull(),
  location: text('location').notNull(),
  city: text('city'),
  lat: text('lat'),
  lng: text('lng'),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  ticketUrl: text('ticket_url'),
  genres: jsonb('genres').$type<string[]>().default(sql`'[]'::jsonb`),
  source: text('source'),
  imageUrl: text('image_url'),
  isPrivate: boolean('is_private').notNull().default(false),
  approved: boolean('approved').notNull().default(false),
  visibility: text('visibility').notNull().default('public'),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  startTimeIdx: index('gigs_start_time_idx').on(table.startTime),
  userIdIdx: index('gigs_user_id_idx').on(table.userId),
  approvedIdx: index('gigs_approved_idx').on(table.approved),
}));

export const eventSubmissions = pgTable('event_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  submitterId: uuid('submitter_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  payload: jsonb('payload').$type<any>().notNull(),
  status: text('status').notNull().default('pending'), // 'pending' | 'auto_approved' | 'rejected' | 'needs_review'
  aiConfidence: integer('ai_confidence'),
  adminComment: text('admin_comment'),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  statusIdx: index('event_submissions_status_idx').on(table.status),
  submitterIdx: index('event_submissions_submitter_idx').on(table.submitterId),
}));

export const eventAttendees = pgTable('event_attendees', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').notNull().references(() => gigs.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('rsvp'), // 'rsvp' | 'ticketed' | 'attended'
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  eventUserIdx: index('event_attendees_event_user_idx').on(table.eventId, table.userId),
}));

export const news = pgTable('news', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  link: text('link').notNull(),
  source: text('source').notNull(),
  publishedAt: timestamp('published_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  publishedAtIdx: index('news_published_at_idx').on(table.publishedAt),
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
  threadCount: integer('thread_count').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const forumThreads = pgTable('forum_threads', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id').references(() => forumCategories.id),
  userId: uuid('user_id').references(() => users.id),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  body: text('body').notNull(),
  tags: jsonb('tags').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  isPinned: boolean('is_pinned').default(false),
  isLocked: boolean('is_locked').default(false),
  isHidden: boolean('is_hidden').default(false),
  visibility: text('visibility').default('public'), // 'public' | 'members' | 'private'
  viewCount: integer('view_count').default(0),
  replyCount: integer('reply_count').default(0),
  likesCount: integer('likes_count').default(0),
  aiSummary: text('ai_summary'),
  toxicityScore: integer('toxicity_score').default(0),
  moderationStatus: text('moderation_status').default('approved'),
  embedLinks: jsonb('embed_links').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  createdAtIdx: index('forum_threads_created_at_idx').on(table.createdAt),
  likesCountIdx: index('forum_threads_likes_count_idx').on(table.likesCount),
  categoryIdIdx: index('forum_threads_category_id_idx').on(table.categoryId),
  moderationStatusIdx: index('forum_threads_moderation_status_idx').on(table.moderationStatus),
}));

export const forumReplies = pgTable('forum_replies', {
  id: uuid('id').primaryKey().defaultRandom(),
  threadId: uuid('thread_id').notNull().references(() => forumThreads.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id),
  body: text('body').notNull(),
  toxicityScore: integer('toxicity_score').default(0),
  aiFlags: jsonb('ai_flags').$type<string[]>(),
  moderationStatus: text('moderation_status').default('approved'),
  likesCount: integer('likes_count').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  threadIdIdx: index('forum_replies_thread_id_idx').on(table.threadId),
  createdAtIdx: index('forum_replies_created_at_idx').on(table.createdAt),
  moderationStatusIdx: index('forum_replies_moderation_status_idx').on(table.moderationStatus),
}));

export const threadLikes = pgTable('thread_likes', {
  id: uuid('id').primaryKey().defaultRandom(),
  threadId: uuid('thread_id').notNull().references(() => forumThreads.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  threadUserIdx: index('thread_likes_thread_user_idx').on(table.threadId, table.userId),
}));

export const userReputation = pgTable('user_reputation', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  karmaPoints: integer('karma_points').notNull().default(0),
  badges: jsonb('badges').$type<string[]>().default(sql`'[]'::jsonb`),
  weeklyRank: integer('weekly_rank'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('user_reputation_user_id_idx').on(table.userId),
  karmaPointsIdx: index('user_reputation_karma_points_idx').on(table.karmaPoints),
}));

export const forumReports = pgTable('forum_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  targetType: text('target_type').notNull(),
  targetId: uuid('target_id').notNull(),
  reporterId: uuid('reporter_id').notNull().references(() => users.id),
  reason: text('reason').notNull(),
  aiConfidence: integer('ai_confidence'),
  status: text('status').notNull().default('open'),
  resolvedBy: uuid('resolved_by').references(() => users.id),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  statusIdx: index('forum_reports_status_idx').on(table.status),
  targetTypeIdx: index('forum_reports_target_type_idx').on(table.targetType),
  createdAtIdx: index('forum_reports_created_at_idx').on(table.createdAt),
}));

export const modActions = pgTable('mod_actions', {
  id: uuid('id').primaryKey().defaultRandom(),
  moderatorId: uuid('moderator_id').notNull().references(() => users.id),
  action: text('action').notNull(),
  targetType: text('target_type').notNull(),
  targetId: uuid('target_id').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  moderatorIdIdx: index('mod_actions_moderator_id_idx').on(table.moderatorId),
  createdAtIdx: index('mod_actions_created_at_idx').on(table.createdAt),
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
  progress: integer('progress').notNull().default(0),
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

export const verificationTasks = pgTable('verification_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  jobId: uuid('job_id').references(() => verificationJobs.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('pending'),
  priority: text('priority').notNull().default('normal'),
  assignedTo: uuid('assigned_to').references(() => users.id),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  resolvedAt: timestamp('resolved_at'),
}, (table) => ({
  statusIdx: index('verification_tasks_status_idx').on(table.status),
  userIdIdx: index('verification_tasks_user_id_idx').on(table.userId),
}));

export const signupVerifications = pgTable('signup_verifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  input: jsonb('input').$type<any>().notNull(),
  result: jsonb('result').$type<any>(),
  aiScore: numeric('ai_score', { precision: 5, scale: 2 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  processedAt: timestamp('processed_at'),
}, (table) => ({
  profileIdIdx: index('signup_verifications_profile_id_idx').on(table.profileId),
  statusIdx: index('signup_verifications_status_idx').on(table.status),
  createdAtIdx: index('signup_verifications_created_at_idx').on(table.createdAt),
}));

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  link: varchar('link', { length: 500 }),
  read: boolean('read').default(false).notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const notificationSubscriptions = pgTable('notification_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull(),
  keys: jsonb('keys').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  action: text('action').notNull(),
  resource: text('resource').notNull(),
  resourceId: text('resource_id'),
  changes: jsonb('changes').$type<any>(),
  metadata: jsonb('metadata').$type<any>(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('audit_logs_user_id_idx').on(table.userId),
  actionIdx: index('audit_logs_action_idx').on(table.action),
  createdAtIdx: index('audit_logs_created_at_idx').on(table.createdAt),
}));

export const gigsSettings = pgTable('gigs_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: text('key').notNull().unique(),
  value: jsonb('value').$type<any>().notNull(),
  description: text('description'),
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const passwordResets = pgTable('password_resets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  used: boolean('used').notNull().default(false),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  tokenIdx: index('password_resets_token_idx').on(table.token),
  userIdIdx: index('password_resets_user_id_idx').on(table.userId),
}));

export const loginAttempts = pgTable('login_attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  identifier: text('identifier').notNull(), // email or IP
  attempts: integer('attempts').notNull().default(1),
  lastAttemptAt: timestamp('last_attempt_at').notNull().defaultNow(),
  blockedUntil: timestamp('blocked_until'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  identifierIdx: index('login_attempts_identifier_idx').on(table.identifier),
}));

// New tables for events and artist_events
export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  venue: text('venue').notNull(),
  location: text('location').notNull(),
  city: text('city'),
  lat: text('lat'),
  lng: text('lng'),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  ticketUrl: text('ticket_url'),
  genres: jsonb('genres').$type<string[]>().default(sql`'[]'::jsonb`),
  source: text('source'),
  imageUrl: text('image_url'),
  isPrivate: boolean('is_private').notNull().default(false),
  approved: boolean('approved').notNull().default(false),
  visibility: text('visibility').notNull().default('public'), // 'public', 'private', 'artist_only'
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  startTimeIdx: index('events_start_time_idx').on(table.startTime),
  approvedIdx: index('events_approved_idx').on(table.approved),
  visibilityIdx: index('events_visibility_idx').on(table.visibility),
}));

export const artistEvents = pgTable('artist_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  artistId: uuid('artist_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  artistEventIdx: index('artist_events_artist_event_idx').on(table.artistId, table.eventId),
}));

export const views = pgTable('views', {
  id: uuid('id').primaryKey().defaultRandom(),
  targetType: text('target_type').notNull(), // 'thread' | 'post' | 'profile' | 'epk' | 'meme' | 'event'
  targetId: uuid('target_id').notNull(),
  userId: uuid('user_id').references(() => users.id), // Null for anonymous views
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  targetIdx: index('views_target_idx').on(table.targetType, table.targetId),
  userIdIdx: index('views_user_id_idx').on(table.userId),
  createdAtIdx: index('views_created_at_idx').on(table.createdAt),
}));

export const reactions = pgTable('reactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  targetType: text('target_type').notNull(), // 'thread' | 'post' | 'profile' | 'epk' | 'meme' | 'event'
  targetId: uuid('target_id').notNull(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  reaction: text('reaction').notNull(), // 'like' | 'love' | 'fire' | 'laugh'
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  targetUserUniqueIdx: uniqueIndex('reactions_target_user_unique_idx').on(table.targetType, table.targetId, table.userId),
  userIdIdx: index('reactions_user_id_idx').on(table.userId),
}));

export const forumAttachments = pgTable('forum_attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  postType: text('post_type').notNull(), // 'thread' | 'reply'
  postId: uuid('post_id').notNull(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'image' | 'ai_meme' | 'ai_cover' | 'file'
  url: text('url').notNull(),
  filename: text('filename'),
  size: integer('size'),
  aiJobId: uuid('ai_job_id').references(() => aiJobs.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  postIdx: index('forum_attachments_post_idx').on(table.postType, table.postId),
  userIdIdx: index('forum_attachments_user_id_idx').on(table.userId),
}));

export const threadDrafts = pgTable('thread_drafts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title'),
  categoryId: uuid('category_id').references(() => forumCategories.id),
  body: text('body'),
  tags: jsonb('tags').$type<string[]>().default(sql`'[]'::jsonb`),
  visibility: text('visibility').default('public'), // 'public' | 'members' | 'private'
  metadata: jsonb('metadata').$type<any>(), // For mentions, attachments data
  lastSavedAt: timestamp('last_saved_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('thread_drafts_user_id_idx').on(table.userId),
  lastSavedAtIdx: index('thread_drafts_last_saved_at_idx').on(table.lastSavedAt),
}));

export const mentions = pgTable('mentions', {
  id: uuid('id').primaryKey().defaultRandom(),
  contentType: text('content_type').notNull(), // 'thread' | 'reply'
  contentId: uuid('content_id').notNull(),
  authorId: uuid('author_id').notNull().references(() => users.id),
  mentionedUserId: uuid('mentioned_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  notificationSent: boolean('notification_sent').default(false),
  read: boolean('read').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  mentionedUserIdx: index('mentions_mentioned_user_idx').on(table.mentionedUserId),
  contentIdx: index('mentions_content_idx').on(table.contentType, table.contentId),
  createdAtIdx: index('mentions_created_at_idx').on(table.createdAt),
}));

export const threadFollowers = pgTable('thread_followers', {
  id: uuid('id').primaryKey().defaultRandom(),
  threadId: uuid('thread_id').notNull().references(() => forumThreads.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  notifyOnReply: boolean('notify_on_reply').default(true),
  notifyOnMention: boolean('notify_on_mention').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  threadUserUniqueIdx: uniqueIndex('thread_followers_thread_user_unique_idx').on(table.threadId, table.userId),
  userIdIdx: index('thread_followers_user_id_idx').on(table.userId),
}));

export const moderationQueue = pgTable('moderation_queue', {
  id: uuid('id').primaryKey().defaultRandom(),
  contentType: text('content_type').notNull(), // 'thread' | 'reply'
  contentId: uuid('content_id').notNull(),
  userId: uuid('user_id').notNull().references(() => users.id),
  reason: text('reason').notNull(), // 'spam' | 'toxicity' | 'scam' | 'promo' | 'flagged'
  aiVerdict: text('ai_verdict'), // 'allow' | 'flag' | 'block'
  aiConfidence: integer('ai_confidence'), // 0-100
  aiReasoning: text('ai_reasoning'),
  content: text('content').notNull(),
  metadata: jsonb('metadata').$type<any>(),
  status: text('status').notNull().default('pending'), // 'pending' | 'approved' | 'rejected' | 'auto_approved'
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at'),
  reviewNotes: text('review_notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  statusIdx: index('moderation_queue_status_idx').on(table.status),
  contentIdx: index('moderation_queue_content_idx').on(table.contentType, table.contentId),
  createdAtIdx: index('moderation_queue_created_at_idx').on(table.createdAt),
  userIdIdx: index('moderation_queue_user_id_idx').on(table.userId),
}));

export const socialPromos = pgTable('social_promos', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'release' | 'gig' | 'announcement' | 'general'
  title: text('title').notNull(),
  caption: text('caption').notNull(),
  tags: jsonb('tags').$type<string[]>().default(sql`'[]'::jsonb`),
  imageUrl: text('image_url'),
  animationUrl: text('animation_url'),
  aiPrompt: text('ai_prompt'),
  aiImagePrompt: text('ai_image_prompt'),
  themeColor: text('theme_color'),
  platforms: jsonb('platforms').$type<string[]>().default(sql`'[]'::jsonb`), // ['instagram', 'soundcloud', 'bandcamp', etc]
  generatedAt: timestamp('generated_at').notNull().defaultNow(),
  status: text('status').notNull().default('draft'), // 'draft' | 'ready' | 'exported' | 'shared'
  downloadUrl: text('download_url'),
  metadata: jsonb('metadata').$type<any>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('social_promos_user_id_idx').on(table.userId),
  statusIdx: index('social_promos_status_idx').on(table.status),
  createdAtIdx: index('social_promos_created_at_idx').on(table.createdAt),
}));