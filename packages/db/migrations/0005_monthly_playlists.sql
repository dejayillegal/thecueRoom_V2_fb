-- Monthly Playlists Migration
-- Converts weekly playlist system to monthly and adds AI auto-curation infrastructure
-- Date: November 5, 2025

-- Step 1: Rename weekOf to monthOf in existing playlists table (legacy user-facing table)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'playlists' AND column_name = 'week_of'
    ) THEN
        ALTER TABLE "playlists" RENAME COLUMN "week_of" TO "month_of";
    END IF;
END $$;

-- Step 2: Add monthOf field to admin_playlists table
ALTER TABLE "admin_playlists" ADD COLUMN IF NOT EXISTS "month_of" timestamp NOT NULL DEFAULT now();

-- Step 3: Add AI confidence score field to admin_playlists if not exists
ALTER TABLE "admin_playlists" ADD COLUMN IF NOT EXISTS "ai_confidence_score" numeric(5,2);

-- Step 4: Add published_by field to track who published
ALTER TABLE "admin_playlists" ADD COLUMN IF NOT EXISTS "published_by" uuid;
ALTER TABLE "admin_playlists" ADD CONSTRAINT IF NOT EXISTS "admin_playlists_published_by_fk" 
    FOREIGN KEY ("published_by") REFERENCES "users"("id") ON DELETE SET NULL;

-- Step 5: Create playlist_auto_jobs table for AI auto-curation tracking
CREATE TABLE IF NOT EXISTS "playlist_auto_jobs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "playlist_id" uuid,
    "job_type" text NOT NULL DEFAULT 'fallback_generation',
    "status" text NOT NULL DEFAULT 'pending',
    "input_data" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "result_data" jsonb,
    "confidence_score" numeric(5,2),
    "error_message" text,
    "started_at" timestamp,
    "finished_at" timestamp,
    "created_by" uuid,
    "created_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "playlist_auto_jobs_playlist_id_fk" FOREIGN KEY ("playlist_id") REFERENCES "admin_playlists"("id") ON DELETE CASCADE,
    CONSTRAINT "playlist_auto_jobs_created_by_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL
);

-- Step 6: Create indexes for playlist_auto_jobs
CREATE INDEX IF NOT EXISTS "playlist_auto_jobs_playlist_id_idx" ON "playlist_auto_jobs"("playlist_id");
CREATE INDEX IF NOT EXISTS "playlist_auto_jobs_status_idx" ON "playlist_auto_jobs"("status");
CREATE INDEX IF NOT EXISTS "playlist_auto_jobs_job_type_idx" ON "playlist_auto_jobs"("job_type");
CREATE INDEX IF NOT EXISTS "playlist_auto_jobs_created_at_idx" ON "playlist_auto_jobs"("created_at");

-- Step 7: Add index for monthOf field on admin_playlists
CREATE INDEX IF NOT EXISTS "admin_playlists_month_of_idx" ON "admin_playlists"("month_of");

-- Step 8: Add index for monthOf field on playlists (legacy)
CREATE INDEX IF NOT EXISTS "playlists_month_of_idx" ON "playlists"("month_of");

-- Step 9: Update any existing weekly playlists to be monthly-based
-- This updates existing records to use the first day of the month they were in
UPDATE "playlists" 
SET "month_of" = DATE_TRUNC('month', "month_of")
WHERE "month_of" IS NOT NULL;

UPDATE "admin_playlists" 
SET "month_of" = DATE_TRUNC('month', COALESCE("month_of", "created_at"))
WHERE "month_of" IS NOT NULL OR "created_at" IS NOT NULL;

-- Migration rollback script (save for reference, not executed)
-- DROP TABLE IF EXISTS "playlist_auto_jobs";
-- ALTER TABLE "admin_playlists" DROP COLUMN IF EXISTS "month_of";
-- ALTER TABLE "admin_playlists" DROP COLUMN IF EXISTS "ai_confidence_score";
-- ALTER TABLE "admin_playlists" DROP COLUMN IF EXISTS "published_by";
-- ALTER TABLE "playlists" RENAME COLUMN "month_of" TO "week_of";