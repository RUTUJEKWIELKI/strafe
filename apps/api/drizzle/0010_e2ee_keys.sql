CREATE TABLE "device_identity_keys" (
	"algorithm" text DEFAULT 'ed25519' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"device_id" uuid PRIMARY KEY NOT NULL,
	"public_key" text NOT NULL,
	"revoked_at" timestamp with time zone,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "encryption_session_epochs" (
	"conversation_id" uuid PRIMARY KEY NOT NULL,
	"epoch" integer DEFAULT 1 NOT NULL,
	"reason" text NOT NULL,
	"rotated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "key_bundle_versions" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"device_id" uuid PRIMARY KEY NOT NULL,
	"version" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "key_bundle_version_positive" CHECK ("key_bundle_versions"."version" > 0)
);
--> statement-breakpoint
CREATE TABLE "key_revocations" (
	"device_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"key_fingerprint" text NOT NULL,
	"reason" text NOT NULL,
	"revoked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "key_transparency_checkpoints" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"root_hash" text NOT NULL,
	"signature" text NOT NULL,
	"tree_size" bigint PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "key_transparency_leaves" (
	"body" text NOT NULL,
	"hash" text NOT NULL,
	"leaf_index" bigint PRIMARY KEY NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "one_time_prekeys" (
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"device_id" uuid NOT NULL,
	"key_id" integer NOT NULL,
	"public_key" text NOT NULL,
	"version" integer NOT NULL,
	CONSTRAINT "one_time_prekeys_pk" PRIMARY KEY("device_id","key_id")
);
--> statement-breakpoint
CREATE TABLE "signed_prekeys" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"device_id" uuid NOT NULL,
	"key_id" integer NOT NULL,
	"public_key" text NOT NULL,
	"signature" text NOT NULL,
	"version" integer NOT NULL,
	CONSTRAINT "signed_prekeys_pk" PRIMARY KEY("device_id","key_id")
);
--> statement-breakpoint
ALTER TABLE "device_identity_keys" ADD CONSTRAINT "device_identity_keys_device_id_user_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."user_devices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_identity_keys" ADD CONSTRAINT "device_identity_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "key_bundle_versions" ADD CONSTRAINT "key_bundle_versions_device_id_user_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."user_devices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "key_revocations" ADD CONSTRAINT "key_revocations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "one_time_prekeys" ADD CONSTRAINT "one_time_prekeys_device_id_user_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."user_devices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signed_prekeys" ADD CONSTRAINT "signed_prekeys_device_id_user_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."user_devices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "key_revocations_user_idx" ON "key_revocations" USING btree ("user_id","revoked_at");--> statement-breakpoint
CREATE UNIQUE INDEX "key_transparency_leaf_hash_unique" ON "key_transparency_leaves" USING btree ("hash");--> statement-breakpoint
CREATE INDEX "one_time_prekeys_available_idx" ON "one_time_prekeys" USING btree ("device_id","consumed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "signed_prekeys_device_version_unique" ON "signed_prekeys" USING btree ("device_id","version");