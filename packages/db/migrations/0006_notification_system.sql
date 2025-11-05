-- Notification System Enhancement Migration
-- Adds comprehensive notification, toast, and audit logging capabilities
-- Date: November 5, 2025

-- Step 1: Update existing notifications table with new fields
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "body" text;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "payload" jsonb;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "delivered" boolean DEFAULT false NOT NULL;

-- Migrate existing message column to body if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'message'
    ) THEN
        UPDATE "notifications" SET "body" = COALESCE("message", '') WHERE "body" IS NULL;
        ALTER TABLE "notifications" DROP COLUMN IF EXISTS "message";
    END IF;
END $$;

-- Make body NOT NULL after migration
ALTER TABLE "notifications" ALTER COLUMN "body" SET NOT NULL;

-- Make userId nullable to allow broadcast notifications
ALTER TABLE "notifications" ALTER COLUMN "user_id" DROP NOT NULL;

-- Step 2: Create indexes for notifications table
CREATE INDEX IF NOT EXISTS "notifications_user_id_read_created_idx" ON "notifications"("user_id", "read", "created_at");
CREATE INDEX IF NOT EXISTS "notifications_user_id_idx" ON "notifications"("user_id");
CREATE INDEX IF NOT EXISTS "notifications_type_idx" ON "notifications"("type");

-- Step 3: Create notification_preferences table
CREATE TABLE IF NOT EXISTS "notification_preferences" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL UNIQUE,
    "email_digest" boolean DEFAULT true NOT NULL,
    "in_app" boolean DEFAULT true NOT NULL,
    "push" boolean DEFAULT false NOT NULL,
    "dnd_start" text,
    "dnd_end" text,
    "muted_types" jsonb DEFAULT '[]'::jsonb,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "notification_preferences_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "notification_preferences_user_id_idx" ON "notification_preferences"("user_id");

-- Step 4: Create notification_audit_log table
CREATE TABLE IF NOT EXISTS "notification_audit_log" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "action" text NOT NULL,
    "payload" jsonb NOT NULL,
    "performed_by" uuid,
    "target_user_ids" jsonb,
    "notification_ids" jsonb,
    "created_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "notification_audit_log_performed_by_fk" FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "notification_audit_log_performed_by_idx" ON "notification_audit_log"("performed_by");
CREATE INDEX IF NOT EXISTS "notification_audit_log_created_at_idx" ON "notification_audit_log"("created_at");
CREATE INDEX IF NOT EXISTS "notification_audit_log_action_idx" ON "notification_audit_log"("action");

-- Step 5: Create toasts table
CREATE TABLE IF NOT EXISTS "toasts" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid,
    "type" varchar(50) NOT NULL,
    "title" varchar(255),
    "body" text NOT NULL,
    "status" varchar(50) NOT NULL DEFAULT 'pending',
    "action" jsonb,
    "metadata" jsonb,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "toasts_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "toasts_user_id_status_idx" ON "toasts"("user_id", "status");
CREATE INDEX IF NOT EXISTS "toasts_created_at_idx" ON "toasts"("created_at");

-- Step 6: Create function to auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 7: Create triggers for auto-updating updated_at
CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON "notification_preferences"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_toasts_updated_at BEFORE UPDATE ON "toasts"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Migration rollback script (save for reference, not executed)
-- DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON "notification_preferences";
-- DROP TRIGGER IF EXISTS update_toasts_updated_at ON "toasts";
-- DROP FUNCTION IF EXISTS update_updated_at_column();
-- DROP TABLE IF EXISTS "toasts";
-- DROP TABLE IF EXISTS "notification_audit_log";
-- DROP TABLE IF EXISTS "notification_preferences";
-- DROP INDEX IF EXISTS "notifications_type_idx";
-- DROP INDEX IF EXISTS "notifications_user_id_idx";
-- DROP INDEX IF EXISTS "notifications_user_id_read_created_idx";
