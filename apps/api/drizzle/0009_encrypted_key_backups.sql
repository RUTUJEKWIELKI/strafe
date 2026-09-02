CREATE TABLE "encrypted_key_backups" (
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "version" integer NOT NULL,
  "ciphertext" text NOT NULL,
  "aead" text NOT NULL,
  "nonce" text NOT NULL,
  "kdf" jsonb NOT NULL,
  "previous_digest" text,
  "identity_key_fingerprint" text NOT NULL,
  "device_id" uuid NOT NULL,
  "created_at" timestamp with time zone NOT NULL,
  "uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "encrypted_key_backups_user_id_version_pk" PRIMARY KEY("user_id", "version"),
  CONSTRAINT "encrypted_key_backups_version_check" CHECK ("version" > 0)
);
CREATE INDEX "encrypted_key_backups_latest_idx" ON "encrypted_key_backups" ("user_id", "version" DESC);
