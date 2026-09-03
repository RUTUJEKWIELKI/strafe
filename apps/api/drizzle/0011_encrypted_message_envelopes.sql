-- Protocol migration v1. Plaintext is quarantined, never re-labelled as ciphertext.
ALTER TABLE "messages" RENAME COLUMN "content" TO "legacy_plaintext";
ALTER TABLE "messages" ADD COLUMN "ciphertext" text;
ALTER TABLE "messages" ADD COLUMN "protocol_version" integer;
ALTER TABLE "messages" ADD COLUMN "content_type" text;
ALTER TABLE "messages" ADD COLUMN "sender_device_id" uuid;
ALTER TABLE "messages" ADD COLUMN "message_epoch" integer;
ALTER TABLE "messages" ADD COLUMN "nonce" text;
ALTER TABLE "messages" ADD COLUMN "authentication_tag" text;
ALTER TABLE "messages" ADD COLUMN "migration_state" text NOT NULL DEFAULT 'legacy_unconvertible';
ALTER TABLE "messages" ADD CONSTRAINT "messages_envelope_state_check" CHECK ((migration_state = 'legacy_unconvertible' AND ciphertext IS NULL AND protocol_version IS NULL) OR (migration_state = 'encrypted' AND ciphertext IS NOT NULL AND protocol_version IS NOT NULL AND content_type IS NOT NULL AND sender_device_id IS NOT NULL AND message_epoch IS NOT NULL AND nonce IS NOT NULL AND authentication_tag IS NOT NULL));

ALTER TABLE "message_edits" RENAME COLUMN "content" TO "legacy_plaintext";
ALTER TABLE "message_edits" ADD COLUMN "ciphertext" text;
ALTER TABLE "message_edits" ADD COLUMN "protocol_version" integer;
ALTER TABLE "message_edits" ADD COLUMN "content_type" text;
ALTER TABLE "message_edits" ADD COLUMN "sender_device_id" uuid;
ALTER TABLE "message_edits" ADD COLUMN "message_epoch" integer;
ALTER TABLE "message_edits" ADD COLUMN "nonce" text;
ALTER TABLE "message_edits" ADD COLUMN "authentication_tag" text;
ALTER TABLE "message_edits" ADD COLUMN "migration_state" text NOT NULL DEFAULT 'legacy_unconvertible';

-- Pending plaintext-bearing message events cannot be safely converted. Discard them;
-- clients obtain explicitly marked historical rows through message history instead.
DELETE FROM "outbox_events" WHERE "aggregate_type" = 'message' AND "processed_at" IS NULL;
