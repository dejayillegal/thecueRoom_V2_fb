import { pgTable, text, timestamp, jsonb, integer, boolean, uuid, index } from 'drizzle-orm/pg-core';

// Users table
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

// Feeds table - SINGLE SOURCE OF TRUTH
export const feeds = pgTable('feeds', {
  id: uuid('id').primaryKey().defaultRandom(),
  source: text('source').notNull(),
  title: text('title').notNull(),
  summary: text('summary'),
  url: text('url').notNull().unique(),
  thumbnailUrl: text('thumbnail_url'),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  lastIngestedAt: timestamp('last_ingested_at', { withTimezone: true }), // State is stored per-feed or derived from latest entry
});
