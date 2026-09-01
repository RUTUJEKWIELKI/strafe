CREATE TABLE "system_metadata" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"key" text PRIMARY KEY NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"value" jsonb NOT NULL
);
