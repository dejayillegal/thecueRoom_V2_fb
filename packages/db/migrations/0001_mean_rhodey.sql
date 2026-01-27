CREATE TABLE IF NOT EXISTS "login_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_attempt_at" timestamp DEFAULT now() NOT NULL,
	"blocked_until" timestamp,
	CONSTRAINT "login_attempts_identifier_unique" UNIQUE("identifier")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"link" text,
	"read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verification_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"profile_url" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"progress" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "ai_jobs" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "assets" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "epks" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "fetch_logs" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "forum_comments" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "forum_threads" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "gigs" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ingestion_jobs" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "memes" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "playlists" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "sources" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "spotlight_items" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "ai_jobs" CASCADE;--> statement-breakpoint
DROP TABLE "assets" CASCADE;--> statement-breakpoint
DROP TABLE "epks" CASCADE;--> statement-breakpoint
DROP TABLE "fetch_logs" CASCADE;--> statement-breakpoint
DROP TABLE "forum_comments" CASCADE;--> statement-breakpoint
DROP TABLE "forum_threads" CASCADE;--> statement-breakpoint
DROP TABLE "gigs" CASCADE;--> statement-breakpoint
DROP TABLE "ingestion_jobs" CASCADE;--> statement-breakpoint
DROP TABLE "memes" CASCADE;--> statement-breakpoint
DROP TABLE "playlists" CASCADE;--> statement-breakpoint
DROP TABLE "sources" CASCADE;--> statement-breakpoint
DROP TABLE "spotlight_items" CASCADE;--> statement-breakpoint
ALTER TABLE "feeds" DROP CONSTRAINT "feeds_content_hash_unique";--> statement-breakpoint
ALTER TABLE "feeds" DROP CONSTRAINT "feeds_source_id_sources_id_fk";
--> statement-breakpoint
ALTER TABLE "profiles" DROP CONSTRAINT "profiles_user_id_users_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "feeds_published_at_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "feeds_source_published_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "feeds_content_hash_idx";--> statement-breakpoint
ALTER TABLE "feeds" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "feeds" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "feeds" ALTER COLUMN "published_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "feeds" ALTER COLUMN "published_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "feeds" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "feeds" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "social_links" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "ai_credits" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "ai_credits" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "updated_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updated_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "feeds" ADD COLUMN "source" text NOT NULL;--> statement-breakpoint
ALTER TABLE "feeds" ADD COLUMN "url" varchar(2048) NOT NULL;--> statement-breakpoint
ALTER TABLE "feeds" ADD COLUMN "thumbnail" text NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "first_name" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "last_name" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "artist_name" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "region" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "genre" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "social_profile_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "username" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "verified" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "verification_status" text DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login_at" timestamp;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "verification_jobs" ADD CONSTRAINT "verification_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "feeds" DROP COLUMN IF EXISTS "source_id";--> statement-breakpoint
ALTER TABLE "feeds" DROP COLUMN IF EXISTS "content";--> statement-breakpoint
ALTER TABLE "feeds" DROP COLUMN IF EXISTS "link";--> statement-breakpoint
ALTER TABLE "feeds" DROP COLUMN IF EXISTS "image";--> statement-breakpoint
ALTER TABLE "feeds" DROP COLUMN IF EXISTS "tags";--> statement-breakpoint
ALTER TABLE "feeds" DROP COLUMN IF EXISTS "content_hash";--> statement-breakpoint
ALTER TABLE "feeds" DROP COLUMN IF EXISTS "raw_data";--> statement-breakpoint
ALTER TABLE "profiles" DROP COLUMN IF EXISTS "avatar";--> statement-breakpoint
ALTER TABLE "profiles" DROP COLUMN IF EXISTS "phone";--> statement-breakpoint
ALTER TABLE "feeds" ADD CONSTRAINT "feeds_url_unique" UNIQUE("url");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_username_unique" UNIQUE("username");