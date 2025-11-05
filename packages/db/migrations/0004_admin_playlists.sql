
-- Admin Playlists Migration
-- Adds admin playlist configuration, scheduling, and history tracking

-- Admin playlists table for curated playlist management
CREATE TABLE IF NOT EXISTS "admin_playlists" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "platform" text NOT NULL DEFAULT 'spotify',
  "platform_id" text NOT NULL,
  "embed_url" text NOT NULL,
  "cover_image" text,
  "curator_id" uuid,
  "status" text NOT NULL DEFAULT 'draft',
  "auto_curated" boolean DEFAULT false,
  "scheduled_at" timestamp,
  "published_at" timestamp,
  "track_count" integer,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "admin_playlists_curator_id_fk" FOREIGN KEY ("curator_id") REFERENCES "users"("id") ON DELETE SET NULL
);

-- Admin playlists history for versioning and rollback
CREATE TABLE IF NOT EXISTS "admin_playlists_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "admin_playlist_id" uuid NOT NULL,
  "snapshot" jsonb NOT NULL,
  "action" text NOT NULL,
  "created_by" uuid,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "admin_playlists_history_playlist_fk" FOREIGN KEY ("admin_playlist_id") REFERENCES "admin_playlists"("id") ON DELETE CASCADE,
  CONSTRAINT "admin_playlists_history_created_by_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "admin_playlists_platform_id_idx" ON "admin_playlists"("platform_id");
CREATE INDEX IF NOT EXISTS "admin_playlists_status_idx" ON "admin_playlists"("status");
CREATE INDEX IF NOT EXISTS "admin_playlists_scheduled_at_idx" ON "admin_playlists"("scheduled_at");
CREATE INDEX IF NOT EXISTS "admin_playlists_published_at_idx" ON "admin_playlists"("published_at");
CREATE INDEX IF NOT EXISTS "admin_playlists_history_playlist_idx" ON "admin_playlists_history"("admin_playlist_id");
