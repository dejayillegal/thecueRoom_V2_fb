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

export const verificationJobs = pgTable('verification_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  profileUrl: text('profile_url').notNull(),
  status: text('status').notNull().default('queued'),
  progress: integer('progress').default(0),
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
