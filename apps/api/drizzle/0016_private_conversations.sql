ALTER TABLE "channel_members" ADD COLUMN "role" text DEFAULT 'member' NOT NULL;
ALTER TABLE "channel_members" ADD CONSTRAINT "channel_members_role_check" CHECK ("role" in ('owner', 'member'));
UPDATE "channel_members" cm SET "role" = 'owner' FROM "channels" c WHERE cm."channel_id" = c."id" AND cm."user_id" = c."owner_id" AND c."type" = 'group_dm';

CREATE TABLE "conversation_events" (
  "id" uuid PRIMARY KEY NOT NULL,
  "channel_id" uuid NOT NULL REFERENCES "channels"("id") ON DELETE CASCADE,
  "actor_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "target_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "type" text NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX "conversation_events_channel_time_idx" ON "conversation_events" ("channel_id", "created_at" DESC);
