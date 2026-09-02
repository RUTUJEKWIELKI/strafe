CREATE TABLE "bot_tokens" (
	"bot_id" uuid NOT NULL REFERENCES "bots"("id") ON DELETE CASCADE,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"credential_prefix" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"last_source_hash" text,
	"last_used_at" timestamp with time zone,
	"name" text NOT NULL,
	"revoked_at" timestamp with time zone,
	"scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"token_hash" text NOT NULL
);
CREATE INDEX "bot_tokens_bot_id_idx" ON "bot_tokens" ("bot_id");
CREATE INDEX "bot_tokens_expires_at_idx" ON "bot_tokens" ("expires_at");
CREATE UNIQUE INDEX "bot_tokens_hash_unique" ON "bot_tokens" ("token_hash");
CREATE UNIQUE INDEX "bot_tokens_prefix_unique" ON "bot_tokens" ("credential_prefix");
ALTER TABLE "bots" DROP COLUMN "token_hash";
