UPDATE "user_settings"
SET "locale" = CASE
  WHEN lower("locale") LIKE 'pl%' THEN 'pl'
  ELSE 'en'
END;
--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "locale" SET DEFAULT 'pl';
--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_locale_check" CHECK ("user_settings"."locale" IN ('en', 'pl'));
