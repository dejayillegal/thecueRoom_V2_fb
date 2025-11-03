-- Forum Enhancements Migration
-- Adds thread drafts, mentions, followers, moderation queue, and visibility controls

-- Add visibility column to existing forum_threads table
ALTER TABLE "forum_threads" ADD COLUMN "visibility" text DEFAULT 'public';

-- Create thread_drafts table for autosaving draft threads
CREATE TABLE IF NOT EXISTS "thread_drafts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "title" text,
  "category_id" uuid,
  "body" text,
  "tags" jsonb DEFAULT '[]'::jsonb,
  "visibility" text DEFAULT 'public',
  "metadata" jsonb,
  "last_saved_at" timestamp DEFAULT now() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create mentions table for @mention tracking
CREATE TABLE IF NOT EXISTS "mentions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "content_type" text NOT NULL,
  "content_id" uuid NOT NULL,
  "author_id" uuid NOT NULL,
  "mentioned_user_id" uuid NOT NULL,
  "notification_sent" boolean DEFAULT false,
  "read" boolean DEFAULT false,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create thread_followers table for thread subscriptions
CREATE TABLE IF NOT EXISTS "thread_followers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "thread_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "notify_on_reply" boolean DEFAULT true,
  "notify_on_mention" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create moderation_queue table for AI moderation workflow
CREATE TABLE IF NOT EXISTS "moderation_queue" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "content_type" text NOT NULL,
  "content_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "reason" text NOT NULL,
  "ai_verdict" text,
  "ai_confidence" integer,
  "ai_reasoning" text,
  "content" text NOT NULL,
  "metadata" jsonb,
  "status" text DEFAULT 'pending' NOT NULL,
  "reviewed_by" uuid,
  "reviewed_at" timestamp,
  "review_notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Add foreign keys
ALTER TABLE "thread_drafts" ADD CONSTRAINT "thread_drafts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "thread_drafts" ADD CONSTRAINT "thread_drafts_category_id_forum_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "forum_categories"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

ALTER TABLE "mentions" ADD CONSTRAINT "mentions_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "mentions" ADD CONSTRAINT "mentions_mentioned_user_id_users_id_fk" FOREIGN KEY ("mentioned_user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

ALTER TABLE "thread_followers" ADD CONSTRAINT "thread_followers_thread_id_forum_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "forum_threads"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "thread_followers" ADD CONSTRAINT "thread_followers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

ALTER TABLE "moderation_queue" ADD CONSTRAINT "moderation_queue_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "moderation_queue" ADD CONSTRAINT "moderation_queue_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

-- Create indexes for thread_drafts
CREATE INDEX IF NOT EXISTS "thread_drafts_user_id_idx" ON "thread_drafts" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "thread_drafts_last_saved_at_idx" ON "thread_drafts" ("last_saved_at");
--> statement-breakpoint

-- Create indexes for mentions
CREATE INDEX IF NOT EXISTS "mentions_mentioned_user_idx" ON "mentions" ("mentioned_user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mentions_content_idx" ON "mentions" ("content_type","content_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mentions_created_at_idx" ON "mentions" ("created_at");
--> statement-breakpoint

-- Create indexes for thread_followers
CREATE UNIQUE INDEX IF NOT EXISTS "thread_followers_thread_user_unique_idx" ON "thread_followers" ("thread_id","user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "thread_followers_user_id_idx" ON "thread_followers" ("user_id");
--> statement-breakpoint

-- Create indexes for moderation_queue
CREATE INDEX IF NOT EXISTS "moderation_queue_status_idx" ON "moderation_queue" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "moderation_queue_content_idx" ON "moderation_queue" ("content_type","content_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "moderation_queue_created_at_idx" ON "moderation_queue" ("created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "moderation_queue_user_id_idx" ON "moderation_queue" ("user_id");
