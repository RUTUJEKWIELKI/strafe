CREATE TABLE "bot_applications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"owner_id" uuid NOT NULL,
	"bot_user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bot_applications_bot_user_id_unique" UNIQUE("bot_user_id")
);--> statement-breakpoint
CREATE TABLE "bot_tokens" (
	"id" uuid PRIMARY KEY NOT NULL,
	"bot_id" uuid NOT NULL,
	"name" text NOT NULL,
	"token_hash" text NOT NULL,
	"scopes" text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone
);--> statement-breakpoint
ALTER TABLE "bot_applications" ADD CONSTRAINT "bot_applications_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "bot_applications" ADD CONSTRAINT "bot_applications_bot_user_id_users_id_fk" FOREIGN KEY ("bot_user_id") REFERENCES "public"."users"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "bot_tokens" ADD CONSTRAINT "bot_tokens_bot_id_bot_applications_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bot_applications"("id") ON DELETE cascade;--> statement-breakpoint
CREATE INDEX "bot_applications_owner_id_idx" ON "bot_applications" USING btree ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bot_tokens_token_hash_unique" ON "bot_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "bot_tokens_active_bot_idx" ON "bot_tokens" USING btree ("bot_id","created_at") WHERE "bot_tokens"."revoked_at" is null;
