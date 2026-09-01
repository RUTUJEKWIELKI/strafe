-- Idempotent compatibility migration for databases that recorded an earlier
-- platform-hardening migration before all columns and tables were present.

ALTER TABLE "user_devices" ADD COLUMN IF NOT EXISTS "city" text;
ALTER TABLE "user_devices" ADD COLUMN IF NOT EXISTS "country_code" text;
ALTER TABLE "user_devices" ADD COLUMN IF NOT EXISTS "last_ip_address" text;
ALTER TABLE "user_sessions" ADD COLUMN IF NOT EXISTS "city" text;
ALTER TABLE "user_sessions" ADD COLUMN IF NOT EXISTS "country_code" text;
ALTER TABLE "user_sessions" ADD COLUMN IF NOT EXISTS "ip_address" text;
ALTER TABLE "files" ADD COLUMN IF NOT EXISTS "rejection_reason" text;
ALTER TABLE "moderation_cases" ADD COLUMN IF NOT EXISTS "assigned_to" uuid;
ALTER TABLE "user_reports" ADD COLUMN IF NOT EXISTS "assigned_to" uuid;
ALTER TABLE "user_reports" ADD COLUMN IF NOT EXISTS "resolution_note" text;
ALTER TABLE "user_reports" ADD COLUMN IF NOT EXISTS "updated_at" timestamptz DEFAULT now() NOT NULL;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "group_count" integer DEFAULT 1 NOT NULL;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "group_key" text;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "updated_at" timestamptz DEFAULT now() NOT NULL;
ALTER TABLE "push_subscriptions" ADD COLUMN IF NOT EXISTS "revoked_at" timestamptz;
ALTER TABLE "notification_preferences" ADD COLUMN IF NOT EXISTS "scope_key" text;

UPDATE "notification_preferences"
SET "scope_key" = "type" || ':' || coalesce("server_id"::text, '*') || ':' || coalesce("channel_id"::text, '*')
WHERE "scope_key" IS NULL;

DELETE FROM "notification_preferences" AS duplicate
USING (
  SELECT "id", row_number() OVER (
    PARTITION BY "user_id", "scope_key"
    ORDER BY "updated_at" DESC NULLS LAST, "id" DESC
  ) AS row_number
  FROM "notification_preferences"
) AS ranked
WHERE duplicate."id" = ranked."id" AND ranked.row_number > 1;

ALTER TABLE "notification_preferences" ALTER COLUMN "scope_key" SET NOT NULL;

DO $$
BEGIN
  ALTER TABLE "files" DROP CONSTRAINT IF EXISTS "files_status_check";
  ALTER TABLE "files" ADD CONSTRAINT "files_status_check"
    CHECK ("files"."status" in ('pending', 'processing', 'ready', 'quarantined', 'rejected', 'deleted'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "files" DROP CONSTRAINT IF EXISTS "files_scan_status_check";
  ALTER TABLE "files" ADD CONSTRAINT "files_scan_status_check"
    CHECK ("files"."scan_status" in ('pending', 'clean', 'skipped', 'blocked', 'failed'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "auth_challenges" (
  "attempts" integer DEFAULT 0 NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "id" uuid PRIMARY KEY NOT NULL,
  "pending_value" text,
  "token_hash" text NOT NULL,
  "type" text NOT NULL,
  "used_at" timestamptz,
  "user_id" uuid NOT NULL,
  CONSTRAINT "auth_challenges_type_check" CHECK ("type" in ('password_reset', 'email_verification', 'email_change'))
);
CREATE TABLE IF NOT EXISTS "file_uploads" (
  "aborted_at" timestamptz,
  "completed_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "file_id" uuid NOT NULL,
  "id" uuid PRIMARY KEY NOT NULL,
  "multipart" boolean DEFAULT true NOT NULL,
  "part_size_bytes" integer NOT NULL,
  "provider_upload_id" text NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  CONSTRAINT "file_uploads_status_check" CHECK ("status" in ('pending', 'completed', 'aborted', 'expired')),
  CONSTRAINT "file_uploads_part_size_check" CHECK ("part_size_bytes" >= 5242880)
);
CREATE TABLE IF NOT EXISTS "moderation_appeals" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "decided_at" timestamptz,
  "decided_by" uuid,
  "decision_note" text,
  "id" uuid PRIMARY KEY NOT NULL,
  "reason" text NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "case_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  CONSTRAINT "moderation_appeals_status_check" CHECK ("status" in ('pending', 'accepted', 'rejected'))
);
CREATE TABLE IF NOT EXISTS "notification_digests" (
  "attempts" integer DEFAULT 0 NOT NULL,
  "bucket_key" text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "id" uuid PRIMARY KEY NOT NULL,
  "last_error" text,
  "notification_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "scheduled_for" timestamptz NOT NULL,
  "sent_at" timestamptz,
  "type" text NOT NULL,
  "user_id" uuid NOT NULL,
  CONSTRAINT "notification_digests_type_check" CHECK ("type" in ('immediate', 'hourly', 'daily'))
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'auth_challenges_user_id_users_id_fk') THEN
    ALTER TABLE "auth_challenges" ADD CONSTRAINT "auth_challenges_user_id_users_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'file_uploads_file_id_files_id_fk') THEN
    ALTER TABLE "file_uploads" ADD CONSTRAINT "file_uploads_file_id_files_id_fk"
      FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'moderation_appeals_decided_by_users_id_fk') THEN
    ALTER TABLE "moderation_appeals" ADD CONSTRAINT "moderation_appeals_decided_by_users_id_fk"
      FOREIGN KEY ("decided_by") REFERENCES "users"("id") ON DELETE set null;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'moderation_appeals_case_id_moderation_cases_id_fk') THEN
    ALTER TABLE "moderation_appeals" ADD CONSTRAINT "moderation_appeals_case_id_moderation_cases_id_fk"
      FOREIGN KEY ("case_id") REFERENCES "moderation_cases"("id") ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'moderation_appeals_user_id_users_id_fk') THEN
    ALTER TABLE "moderation_appeals" ADD CONSTRAINT "moderation_appeals_user_id_users_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notification_digests_user_id_users_id_fk') THEN
    ALTER TABLE "notification_digests" ADD CONSTRAINT "notification_digests_user_id_users_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'moderation_cases_assigned_to_users_id_fk') THEN
    ALTER TABLE "moderation_cases" ADD CONSTRAINT "moderation_cases_assigned_to_users_id_fk"
      FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE set null;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_reports_assigned_to_users_id_fk') THEN
    ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_assigned_to_users_id_fk"
      FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE set null;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "auth_challenges_token_hash_unique" ON "auth_challenges" ("token_hash");
CREATE INDEX IF NOT EXISTS "auth_challenges_user_type_idx" ON "auth_challenges" ("user_id", "type", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "auth_challenges_expiry_idx" ON "auth_challenges" ("expires_at");
CREATE UNIQUE INDEX IF NOT EXISTS "file_uploads_active_file_unique" ON "file_uploads" ("file_id") WHERE "status" = 'pending';
CREATE INDEX IF NOT EXISTS "file_uploads_expiry_idx" ON "file_uploads" ("expires_at") WHERE "status" = 'pending';
CREATE UNIQUE INDEX IF NOT EXISTS "moderation_appeals_pending_case_user_unique" ON "moderation_appeals" ("case_id", "user_id") WHERE "status" = 'pending';
CREATE INDEX IF NOT EXISTS "moderation_appeals_case_time_idx" ON "moderation_appeals" ("case_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "notification_digests_pending_idx" ON "notification_digests" ("scheduled_for", "id") WHERE "sent_at" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "notification_digests_bucket_unique" ON "notification_digests" ("bucket_key");
CREATE UNIQUE INDEX IF NOT EXISTS "notification_preferences_user_scope_unique" ON "notification_preferences" ("user_id", "scope_key");
CREATE UNIQUE INDEX IF NOT EXISTS "notifications_user_group_unique" ON "notifications" ("user_id", "group_key") WHERE "group_key" IS NOT NULL;
