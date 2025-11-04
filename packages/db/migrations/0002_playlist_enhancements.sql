-- Playlist Enhancements Migration
-- Adds AI curation support, playlist items, history tracking, and track suggestions

-- Update existing playlists table with new columns for AI curation and status management
ALTER TABLE "playlists" ADD COLUMN IF NOT EXISTS "visibility" text DEFAULT 'public';
ALTER TABLE "playlists" ADD COLUMN IF NOT EXISTS "auto_curated" boolean DEFAULT false;
ALTER TABLE "playlists" ADD COLUMN IF NOT EXISTS "curated_at" timestamp;
ALTER TABLE "playlists" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'draft';
ALTER TABLE "playlists" ADD COLUMN IF NOT EXISTS "scheduled_publish_at" timestamp;
ALTER TABLE "playlists" ADD COLUMN IF NOT EXISTS "ai_confidence_score" integer;
ALTER TABLE "playlists" ADD COLUMN IF NOT EXISTS "metadata" jsonb DEFAULT '{}'::jsonb;

-- Create playlist_items table for individual tracks in a playlist
CREATE TABLE IF NOT EXISTS "playlist_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "playlist_id" uuid NOT NULL,
  "track_platform" text NOT NULL,
  "track_id" text NOT NULL,
  "track_title" text NOT NULL,
  "artist_name" text NOT NULL,
  "track_url" text,
  "preview_url" text,
  "cover_image" text,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "position" integer NOT NULL,
  "ai_score" integer,
  "ai_rationale" text,
  "added_by" uuid,
  "added_at" timestamp DEFAULT now() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create playlist_history table for versioning and rollback
CREATE TABLE IF NOT EXISTS "playlist_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "playlist_id" uuid NOT NULL,
  "snapshot_data" jsonb NOT NULL,
  "changed_by" uuid,
  "change_type" text NOT NULL,
  "change_notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create track_suggestions table for artist submissions
CREATE TABLE IF NOT EXISTS "track_suggestions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "artist_id" uuid NOT NULL,
  "track_platform" text NOT NULL,
  "track_url" text NOT NULL,
  "track_title" text,
  "artist_name" text,
  "notes" text,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "status" text DEFAULT 'pending' NOT NULL,
  "reviewed_by" uuid,
  "reviewed_at" timestamp,
  "review_notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Add foreign keys for playlist_items
ALTER TABLE "playlist_items" ADD CONSTRAINT "playlist_items_playlist_id_playlists_id_fk" FOREIGN KEY ("playlist_id") REFERENCES "playlists"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "playlist_items" ADD CONSTRAINT "playlist_items_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint

-- Add foreign keys for playlist_history
ALTER TABLE "playlist_history" ADD CONSTRAINT "playlist_history_playlist_id_playlists_id_fk" FOREIGN KEY ("playlist_id") REFERENCES "playlists"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "playlist_history" ADD CONSTRAINT "playlist_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint

-- Add foreign keys for track_suggestions
ALTER TABLE "track_suggestions" ADD CONSTRAINT "track_suggestions_artist_id_users_id_fk" FOREIGN KEY ("artist_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "track_suggestions" ADD CONSTRAINT "track_suggestions_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint

-- Create indexes for playlist_items
CREATE INDEX IF NOT EXISTS "playlist_items_playlist_id_idx" ON "playlist_items" ("playlist_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "playlist_items_position_idx" ON "playlist_items" ("playlist_id", "position");
--> statement-breakpoint

-- Create indexes for playlist_history
CREATE INDEX IF NOT EXISTS "playlist_history_playlist_id_idx" ON "playlist_history" ("playlist_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "playlist_history_created_at_idx" ON "playlist_history" ("created_at");
--> statement-breakpoint

-- Create indexes for track_suggestions
CREATE INDEX IF NOT EXISTS "track_suggestions_artist_id_idx" ON "track_suggestions" ("artist_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "track_suggestions_status_idx" ON "track_suggestions" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "track_suggestions_created_at_idx" ON "track_suggestions" ("created_at");
--> statement-breakpoint

-- Create indexes for enhanced playlists table
CREATE INDEX IF NOT EXISTS "playlists_status_idx" ON "playlists" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "playlists_visibility_idx" ON "playlists" ("visibility");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "playlists_curated_at_idx" ON "playlists" ("curated_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "playlists_auto_curated_idx" ON "playlists" ("auto_curated");
