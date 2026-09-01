ALTER TABLE "user_devices" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "user_devices" ADD COLUMN "country_code" text;--> statement-breakpoint
ALTER TABLE "user_devices" ADD COLUMN "last_ip_address" text;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD COLUMN "country_code" text;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD COLUMN "ip_address" text;--> statement-breakpoint
CREATE TABLE "auth_challenges" (
	"attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"pending_value" text,
	"token_hash" text NOT NULL,
	"type" text NOT NULL,
	"used_at" timestamp with time zone,
	"user_id" uuid NOT NULL,
	CONSTRAINT "auth_challenges_type_check" CHECK ("auth_challenges"."type" in ('password_reset', 'email_verification', 'email_change'))
);--> statement-breakpoint
ALTER TABLE "auth_challenges" ADD CONSTRAINT "auth_challenges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "auth_challenges_token_hash_unique" ON "auth_challenges" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "auth_challenges_user_type_idx" ON "auth_challenges" USING btree ("user_id","type","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "auth_challenges_expiry_idx" ON "auth_challenges" USING btree ("expires_at");--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "files" DROP CONSTRAINT "files_status_check";--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_status_check" CHECK ("files"."status" in ('pending', 'processing', 'ready', 'quarantined', 'rejected', 'deleted'));--> statement-breakpoint
ALTER TABLE "files" DROP CONSTRAINT IF EXISTS "files_scan_status_check";--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_scan_status_check" CHECK ("files"."scan_status" in ('pending', 'clean', 'skipped', 'blocked', 'failed'));--> statement-breakpoint
CREATE TABLE "file_uploads" (
	"aborted_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"file_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"multipart" boolean DEFAULT true NOT NULL,
	"part_size_bytes" integer NOT NULL,
	"provider_upload_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	CONSTRAINT "file_uploads_status_check" CHECK ("file_uploads"."status" in ('pending', 'completed', 'aborted', 'expired')),
	CONSTRAINT "file_uploads_part_size_check" CHECK ("file_uploads"."part_size_bytes" >= 5242880)
);--> statement-breakpoint
ALTER TABLE "file_uploads" ADD CONSTRAINT "file_uploads_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "file_uploads_active_file_unique" ON "file_uploads" USING btree ("file_id") WHERE "file_uploads"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "file_uploads_expiry_idx" ON "file_uploads" USING btree ("expires_at") WHERE "file_uploads"."status" = 'pending';--> statement-breakpoint
ALTER TABLE "moderation_cases" ADD COLUMN "assigned_to" uuid;--> statement-breakpoint
ALTER TABLE "moderation_cases" ADD CONSTRAINT "moderation_cases_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_reports" ADD COLUMN "assigned_to" uuid;--> statement-breakpoint
ALTER TABLE "user_reports" ADD COLUMN "resolution_note" text;--> statement-breakpoint
ALTER TABLE "user_reports" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE TABLE "moderation_appeals" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_at" timestamp with time zone,
	"decided_by" uuid,
	"decision_note" text,
	"id" uuid PRIMARY KEY NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"case_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	CONSTRAINT "moderation_appeals_status_check" CHECK ("moderation_appeals"."status" in ('pending', 'accepted', 'rejected'))
);--> statement-breakpoint
ALTER TABLE "moderation_appeals" ADD CONSTRAINT "moderation_appeals_decided_by_users_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_appeals" ADD CONSTRAINT "moderation_appeals_case_id_moderation_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."moderation_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_appeals" ADD CONSTRAINT "moderation_appeals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "moderation_appeals_pending_case_user_unique" ON "moderation_appeals" USING btree ("case_id","user_id") WHERE "moderation_appeals"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "moderation_appeals_case_time_idx" ON "moderation_appeals" USING btree ("case_id","created_at" DESC NULLS LAST);--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "group_count" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "group_key" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "notifications_user_group_unique" ON "notifications" USING btree ("user_id","group_key") WHERE "notifications"."group_key" is not null;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD COLUMN "revoked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD COLUMN "scope_key" text;--> statement-breakpoint
UPDATE "notification_preferences" SET "scope_key" = "type" || ':' || coalesce("server_id"::text, '*') || ':' || coalesce("channel_id"::text, '*');--> statement-breakpoint
DELETE FROM "notification_preferences" AS duplicate
USING (
  SELECT "id", row_number() OVER (
    PARTITION BY "user_id", "scope_key"
    ORDER BY "updated_at" DESC NULLS LAST, "id" DESC
  ) AS row_number
  FROM "notification_preferences"
) AS ranked
WHERE duplicate."id" = ranked."id" AND ranked.row_number > 1;--> statement-breakpoint
ALTER TABLE "notification_preferences" ALTER COLUMN "scope_key" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "notification_preferences_user_scope_unique" ON "notification_preferences" USING btree ("user_id","scope_key");--> statement-breakpoint
CREATE TABLE "notification_digests" (
	"attempts" integer DEFAULT 0 NOT NULL,
	"bucket_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"last_error" text,
	"notification_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"scheduled_for" timestamp with time zone NOT NULL,
	"sent_at" timestamp with time zone,
	"type" text NOT NULL,
	"user_id" uuid NOT NULL,
	CONSTRAINT "notification_digests_type_check" CHECK ("notification_digests"."type" in ('immediate', 'hourly', 'daily'))
);--> statement-breakpoint
ALTER TABLE "notification_digests" ADD CONSTRAINT "notification_digests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notification_digests_pending_idx" ON "notification_digests" USING btree ("scheduled_for","id") WHERE "notification_digests"."sent_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "notification_digests_bucket_unique" ON "notification_digests" USING btree ("bucket_key");
