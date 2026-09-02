ALTER TABLE "files" ADD COLUMN "encryption_mode" text DEFAULT 'none' NOT NULL;
ALTER TABLE "files" ADD COLUMN "encryption_chunk_size_bytes" integer;
ALTER TABLE "files" ADD CONSTRAINT "files_encryption_mode_check" CHECK ("encryption_mode" in ('none', 'e2ee-v1'));
ALTER TABLE "message_attachments" ADD COLUMN "encrypted_envelope" text;
