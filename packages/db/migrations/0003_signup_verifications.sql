-- Signup Verifications Migration
-- Adds signup_verifications table for AI-powered artist verification workflow

-- Create signup_verifications table for audit trail and verification history
CREATE TABLE IF NOT EXISTS "signup_verifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "profile_id" uuid NOT NULL,
  "status" varchar(50) DEFAULT 'pending' NOT NULL,
  "input" jsonb NOT NULL,
  "result" jsonb,
  "ai_score" numeric(5, 2),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "processed_at" timestamp
);
--> statement-breakpoint

-- Add foreign key for profile_id
ALTER TABLE "signup_verifications" ADD CONSTRAINT "signup_verifications_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "signup_verifications_profile_id_idx" ON "signup_verifications" ("profile_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "signup_verifications_status_idx" ON "signup_verifications" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "signup_verifications_created_at_idx" ON "signup_verifications" ("created_at");
--> statement-breakpoint

-- Add comments for documentation
COMMENT ON TABLE "signup_verifications" IS 'Tracks AI verification attempts for artist signups with audit trail';
COMMENT ON COLUMN "signup_verifications"."status" IS 'Verification status: pending, approved, rejected, manual_review';
COMMENT ON COLUMN "signup_verifications"."input" IS 'Original signup data submitted by user';
COMMENT ON COLUMN "signup_verifications"."result" IS 'AI verification analysis result with detailed findings';
COMMENT ON COLUMN "signup_verifications"."ai_score" IS 'AI confidence score (0-100) for authenticity';
