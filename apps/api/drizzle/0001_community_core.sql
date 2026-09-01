CREATE TABLE "channel_members" (
	"channel_id" uuid NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	CONSTRAINT "channel_members_pk" PRIMARY KEY("channel_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "channel_permission_overwrites" (
	"allow_bits" bigint DEFAULT 0 NOT NULL,
	"channel_id" uuid NOT NULL,
	"deny_bits" bigint DEFAULT 0 NOT NULL,
	"subject_id" uuid NOT NULL,
	"subject_type" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "channel_permission_overwrites_pk" PRIMARY KEY("channel_id","subject_type","subject_id"),
	CONSTRAINT "channel_permission_overwrites_subject_type_check" CHECK ("channel_permission_overwrites"."subject_type" in ('role', 'member')),
	CONSTRAINT "channel_permission_overwrites_bits_check" CHECK ("channel_permission_overwrites"."allow_bits" >= 0 and "channel_permission_overwrites"."deny_bits" >= 0)
);
--> statement-breakpoint
CREATE TABLE "channel_voice_settings" (
	"bitrate" integer DEFAULT 64000 NOT NULL,
	"channel_id" uuid PRIMARY KEY NOT NULL,
	"region" text,
	"user_limit" integer DEFAULT 0 NOT NULL,
	"waiting_room_enabled" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "channel_webhooks" (
	"channel_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"revoked_at" timestamp with time zone,
	"secret_hash" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "channels" (
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"flags" integer DEFAULT 0 NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"last_message_id" uuid,
	"locked_at" timestamp with time zone,
	"name" text NOT NULL,
	"owner_id" uuid,
	"parent_id" uuid,
	"position_key" text NOT NULL,
	"server_id" uuid,
	"slowmode_seconds" integer DEFAULT 0 NOT NULL,
	"topic" text,
	"type" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "channels_type_check" CHECK ("channels"."type" in ('category', 'text', 'announcement', 'forum', 'voice', 'stage', 'thread_public', 'thread_private', 'dm', 'group_dm')),
	CONSTRAINT "channels_scope_check" CHECK ((("channels"."type" in ('dm', 'group_dm')) and "channels"."server_id" is null) or (("channels"."type" not in ('dm', 'group_dm')) and "channels"."server_id" is not null)),
	CONSTRAINT "channels_slowmode_check" CHECK ("channels"."slowmode_seconds" between 0 and 21600)
);
--> statement-breakpoint
CREATE TABLE "direct_conversations" (
	"channel_id" uuid PRIMARY KEY NOT NULL,
	"higher_user_id" uuid NOT NULL,
	"lower_user_id" uuid NOT NULL,
	CONSTRAINT "direct_conversations_user_order_check" CHECK ("direct_conversations"."lower_user_id" < "direct_conversations"."higher_user_id")
);
--> statement-breakpoint
CREATE TABLE "forum_post_tags" (
	"tag_id" uuid NOT NULL,
	"thread_id" uuid NOT NULL,
	CONSTRAINT "forum_post_tags_pk" PRIMARY KEY("thread_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "forum_tags" (
	"channel_id" uuid NOT NULL,
	"emoji_key" text,
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"position_key" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "file_variants" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"file_id" uuid NOT NULL,
	"height" integer,
	"id" uuid PRIMARY KEY NOT NULL,
	"mime_type" text NOT NULL,
	"object_key" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"type" text NOT NULL,
	"width" integer
);
--> statement-breakpoint
CREATE TABLE "files" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"duration_ms" integer,
	"height" integer,
	"id" uuid PRIMARY KEY NOT NULL,
	"mime_type" text NOT NULL,
	"object_key" text NOT NULL,
	"original_name" text NOT NULL,
	"owner_id" uuid,
	"purpose" text NOT NULL,
	"scan_status" text DEFAULT 'pending' NOT NULL,
	"server_id" uuid,
	"sha256" text,
	"size_bytes" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"width" integer,
	CONSTRAINT "files_status_check" CHECK ("files"."status" in ('pending', 'processing', 'ready', 'quarantined', 'deleted')),
	CONSTRAINT "files_scan_status_check" CHECK ("files"."scan_status" in ('pending', 'clean', 'blocked', 'failed')),
	CONSTRAINT "files_size_bytes_check" CHECK ("files"."size_bytes" >= 0)
);
--> statement-breakpoint
CREATE TABLE "auth_identities" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"credential_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"password_hash" text,
	"provider" text NOT NULL,
	"provider_subject" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_blocks" (
	"blocked_id" uuid NOT NULL,
	"blocker_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reason" text,
	CONSTRAINT "user_blocks_pk" PRIMARY KEY("blocker_id","blocked_id"),
	CONSTRAINT "user_blocks_distinct_users_check" CHECK ("user_blocks"."blocker_id" <> "user_blocks"."blocked_id")
);
--> statement-breakpoint
CREATE TABLE "user_devices" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"platform" text NOT NULL,
	"trusted_at" timestamp with time zone,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"avatar_file_id" uuid,
	"banner_file_id" uuid,
	"bio" text,
	"display_name" text NOT NULL,
	"pronouns" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_relationships" (
	"accepted_at" timestamp with time zone,
	"addressee_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"requester_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	CONSTRAINT "user_relationships_pk" PRIMARY KEY("requester_id","addressee_id"),
	CONSTRAINT "user_relationships_distinct_users_check" CHECK ("user_relationships"."requester_id" <> "user_relationships"."addressee_id"),
	CONSTRAINT "user_relationships_status_check" CHECK ("user_relationships"."status" in ('pending', 'accepted', 'declined'))
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"device_id" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"last_used_at" timestamp with time zone DEFAULT now() NOT NULL,
	"refresh_token_hash" text NOT NULL,
	"revoked_at" timestamp with time zone,
	"user_agent" text,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"allow_dms_from" text DEFAULT 'server_members' NOT NULL,
	"custom_status" text,
	"custom_status_expires_at" timestamp with time zone,
	"discoverability" text DEFAULT 'everyone' NOT NULL,
	"locale" text DEFAULT 'pl-PL' NOT NULL,
	"manual_status" text DEFAULT 'online' NOT NULL,
	"presence_visibility" text DEFAULT 'everyone' NOT NULL,
	"theme" text DEFAULT 'system' NOT NULL,
	"timezone" text DEFAULT 'Europe/Warsaw' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid PRIMARY KEY NOT NULL,
	CONSTRAINT "user_settings_manual_status_check" CHECK ("user_settings"."manual_status" in ('online', 'idle', 'dnd', 'invisible')),
	CONSTRAINT "user_settings_presence_visibility_check" CHECK ("user_settings"."presence_visibility" in ('everyone', 'friends', 'nobody')),
	CONSTRAINT "user_settings_allow_dms_check" CHECK ("user_settings"."allow_dms_from" in ('everyone', 'friends', 'server_members', 'nobody'))
);
--> statement-breakpoint
CREATE TABLE "users" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"disabled_at" timestamp with time zone,
	"email" text NOT NULL,
	"email_verified_at" timestamp with time zone,
	"handle" text NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"normalized_handle" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_status_check" CHECK ("users"."status" in ('active', 'disabled', 'pending_deletion'))
);
--> statement-breakpoint
CREATE TABLE "channel_read_states" (
	"channel_id" uuid NOT NULL,
	"last_read_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_read_message_id" uuid,
	"mention_count" integer DEFAULT 0 NOT NULL,
	"user_id" uuid NOT NULL,
	CONSTRAINT "channel_read_states_pk" PRIMARY KEY("channel_id","user_id"),
	CONSTRAINT "channel_read_states_mention_count_check" CHECK ("channel_read_states"."mention_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "message_attachments" (
	"alt_text" text,
	"file_id" uuid NOT NULL,
	"message_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "message_attachments_pk" PRIMARY KEY("message_id","file_id")
);
--> statement-breakpoint
CREATE TABLE "message_edits" (
	"content" text NOT NULL,
	"edited_at" timestamp with time zone DEFAULT now() NOT NULL,
	"editor_id" uuid,
	"id" uuid PRIMARY KEY NOT NULL,
	"message_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_embeds" (
	"data" jsonb NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"message_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"url" text
);
--> statement-breakpoint
CREATE TABLE "message_mentions" (
	"message_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL,
	"subject_type" text NOT NULL,
	CONSTRAINT "message_mentions_pk" PRIMARY KEY("message_id","subject_type","subject_id"),
	CONSTRAINT "message_mentions_subject_type_check" CHECK ("message_mentions"."subject_type" in ('user', 'role', 'channel'))
);
--> statement-breakpoint
CREATE TABLE "message_pins" (
	"channel_id" uuid NOT NULL,
	"message_id" uuid PRIMARY KEY NOT NULL,
	"pinned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"pinned_by" uuid
);
--> statement-breakpoint
CREATE TABLE "message_reactions" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"emoji_key" text NOT NULL,
	"message_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	CONSTRAINT "message_reactions_pk" PRIMARY KEY("message_id","emoji_key","user_id")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"author_id" uuid,
	"channel_id" uuid NOT NULL,
	"client_nonce" uuid,
	"content" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"edited_at" timestamp with time zone,
	"flags" integer DEFAULT 0 NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"reply_to_message_id" uuid,
	"type" text DEFAULT 'default' NOT NULL,
	CONSTRAINT "messages_type_check" CHECK ("messages"."type" in ('default', 'system', 'reply', 'thread_starter'))
);
--> statement-breakpoint
CREATE TABLE "user_message_bookmarks" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"message_id" uuid NOT NULL,
	"note" text,
	"user_id" uuid NOT NULL,
	CONSTRAINT "user_message_bookmarks_pk" PRIMARY KEY("user_id","message_id")
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"action" text NOT NULL,
	"actor_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"reason" text,
	"server_id" uuid,
	"target_id" uuid,
	"target_type" text
);
--> statement-breakpoint
CREATE TABLE "automod_events" (
	"action_taken" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"rule_id" uuid NOT NULL,
	"target_id" uuid NOT NULL,
	"user_id" uuid
);
--> statement-breakpoint
CREATE TABLE "automod_rules" (
	"action" text NOT NULL,
	"config" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"enabled" boolean DEFAULT true NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"server_id" uuid NOT NULL,
	"trigger_type" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moderation_actions" (
	"action" text NOT NULL,
	"actor_id" uuid,
	"case_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"id" uuid PRIMARY KEY NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"reason" text,
	CONSTRAINT "moderation_actions_action_check" CHECK ("moderation_actions"."action" in ('warn', 'delete_content', 'timeout', 'kick', 'ban', 'unban', 'note'))
);
--> statement-breakpoint
CREATE TABLE "moderation_cases" (
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"opened_by" uuid,
	"reason" text,
	"server_id" uuid NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"subject_id" uuid NOT NULL,
	"subject_type" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "moderation_cases_status_check" CHECK ("moderation_cases"."status" in ('open', 'resolved', 'dismissed', 'appealed')),
	CONSTRAINT "moderation_cases_subject_type_check" CHECK ("moderation_cases"."subject_type" in ('user', 'message', 'server', 'channel'))
);
--> statement-breakpoint
CREATE TABLE "user_reports" (
	"category" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"description" text,
	"id" uuid PRIMARY KEY NOT NULL,
	"reporter_id" uuid NOT NULL,
	"resolved_at" timestamp with time zone,
	"server_id" uuid,
	"status" text DEFAULT 'open' NOT NULL,
	"target_id" uuid NOT NULL,
	"target_type" text NOT NULL,
	CONSTRAINT "user_reports_status_check" CHECK ("user_reports"."status" in ('open', 'reviewing', 'resolved', 'dismissed')),
	CONSTRAINT "user_reports_target_type_check" CHECK ("user_reports"."target_type" in ('user', 'message', 'server', 'channel'))
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"owner_id" uuid NOT NULL,
	"public_key" text,
	"secret_hash" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bots" (
	"application_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"token_hash" text NOT NULL,
	"user_id" uuid
);
--> statement-breakpoint
CREATE TABLE "integration_installations" (
	"application_id" uuid NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"installed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"installed_by" uuid,
	"revoked_at" timestamp with time zone,
	"scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"server_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"channel_id" uuid,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"server_id" uuid,
	"type" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"read_at" timestamp with time zone,
	"seen_at" timestamp with time zone,
	"type" text NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"endpoint" text NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"keys" jsonb NOT NULL,
	"last_error" text,
	"last_used_at" timestamp with time zone,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_deliveries" (
	"attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"last_error" text,
	"next_attempt_at" timestamp with time zone,
	"payload" jsonb NOT NULL,
	"response_code" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"webhook_id" uuid NOT NULL,
	CONSTRAINT "webhook_deliveries_status_check" CHECK ("webhook_deliveries"."status" in ('pending', 'processing', 'delivered', 'failed', 'dead_letter'))
);
--> statement-breakpoint
CREATE TABLE "outbox_events" (
	"aggregate_id" uuid,
	"aggregate_type" text NOT NULL,
	"aggregate_version" integer DEFAULT 1 NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"last_error" text,
	"locked_at" timestamp with time zone,
	"locked_by" text,
	"payload" jsonb NOT NULL,
	"processed_at" timestamp with time zone,
	"topic" text NOT NULL,
	CONSTRAINT "outbox_events_attempts_check" CHECK ("outbox_events"."attempts" >= 0),
	CONSTRAINT "outbox_events_aggregate_version_check" CHECK ("outbox_events"."aggregate_version" >= 1)
);
--> statement-breakpoint
CREATE TABLE "server_bans" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"moderator_id" uuid,
	"reason" text,
	"server_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	CONSTRAINT "server_bans_pk" PRIMARY KEY("server_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "server_emojis" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"file_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"server_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "server_invites" (
	"channel_id" uuid,
	"code_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid NOT NULL,
	"expires_at" timestamp with time zone,
	"id" uuid PRIMARY KEY NOT NULL,
	"max_uses" integer,
	"revoked_at" timestamp with time zone,
	"server_id" uuid NOT NULL,
	"uses" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "server_invites_max_uses_check" CHECK ("server_invites"."max_uses" is null or "server_invites"."max_uses" > 0),
	CONSTRAINT "server_invites_uses_check" CHECK ("server_invites"."uses" >= 0)
);
--> statement-breakpoint
CREATE TABLE "server_member_profiles" (
	"avatar_file_id" uuid,
	"bio" text,
	"member_id" uuid PRIMARY KEY NOT NULL,
	"nickname" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "server_member_roles" (
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"assigned_by" uuid,
	"member_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	CONSTRAINT "server_member_roles_pk" PRIMARY KEY("member_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "server_members" (
	"id" uuid PRIMARY KEY NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"left_at" timestamp with time zone,
	"membership_version" integer DEFAULT 1 NOT NULL,
	"permissions_version" integer DEFAULT 1 NOT NULL,
	"server_id" uuid NOT NULL,
	"state" text DEFAULT 'active' NOT NULL,
	"timeout_until" timestamp with time zone,
	"user_id" uuid NOT NULL,
	CONSTRAINT "server_members_state_check" CHECK ("server_members"."state" in ('active', 'pending', 'left'))
);
--> statement-breakpoint
CREATE TABLE "server_roles" (
	"color" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_managed" boolean DEFAULT false NOT NULL,
	"name" text NOT NULL,
	"permissions" bigint DEFAULT 0 NOT NULL,
	"position_key" text NOT NULL,
	"server_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "server_roles_permissions_check" CHECK ("server_roles"."permissions" >= 0)
);
--> statement-breakpoint
CREATE TABLE "servers" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"deletion_scheduled_at" timestamp with time zone,
	"description" text,
	"icon_file_id" uuid,
	"id" uuid PRIMARY KEY NOT NULL,
	"member_count" integer DEFAULT 1 NOT NULL,
	"name" text NOT NULL,
	"owner_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"visibility" text DEFAULT 'private' NOT NULL,
	CONSTRAINT "servers_visibility_check" CHECK ("servers"."visibility" in ('private', 'unlisted', 'public')),
	CONSTRAINT "servers_member_count_check" CHECK ("servers"."member_count" >= 0),
	CONSTRAINT "servers_version_check" CHECK ("servers"."version" >= 1)
);
--> statement-breakpoint
CREATE TABLE "voice_session_participants" (
	"disconnect_reason" text,
	"id" uuid PRIMARY KEY NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"left_at" timestamp with time zone,
	"session_id" uuid NOT NULL,
	"user_id" uuid
);
--> statement-breakpoint
CREATE TABLE "voice_sessions" (
	"channel_id" uuid NOT NULL,
	"ended_at" timestamp with time zone,
	"id" uuid PRIMARY KEY NOT NULL,
	"region" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "channel_members" ADD CONSTRAINT "channel_members_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_members" ADD CONSTRAINT "channel_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_permission_overwrites" ADD CONSTRAINT "channel_permission_overwrites_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_voice_settings" ADD CONSTRAINT "channel_voice_settings_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_webhooks" ADD CONSTRAINT "channel_webhooks_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_webhooks" ADD CONSTRAINT "channel_webhooks_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channels" ADD CONSTRAINT "channels_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channels" ADD CONSTRAINT "channels_parent_id_channels_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channels" ADD CONSTRAINT "channels_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direct_conversations" ADD CONSTRAINT "direct_conversations_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direct_conversations" ADD CONSTRAINT "direct_conversations_higher_user_id_users_id_fk" FOREIGN KEY ("higher_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direct_conversations" ADD CONSTRAINT "direct_conversations_lower_user_id_users_id_fk" FOREIGN KEY ("lower_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_post_tags" ADD CONSTRAINT "forum_post_tags_tag_id_forum_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."forum_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_post_tags" ADD CONSTRAINT "forum_post_tags_thread_id_channels_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_tags" ADD CONSTRAINT "forum_tags_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_variants" ADD CONSTRAINT "file_variants_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_identities" ADD CONSTRAINT "auth_identities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocked_id_users_id_fk" FOREIGN KEY ("blocked_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocker_id_users_id_fk" FOREIGN KEY ("blocker_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_devices" ADD CONSTRAINT "user_devices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_relationships" ADD CONSTRAINT "user_relationships_addressee_id_users_id_fk" FOREIGN KEY ("addressee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_relationships" ADD CONSTRAINT "user_relationships_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_device_id_user_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."user_devices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_read_states" ADD CONSTRAINT "channel_read_states_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_read_states" ADD CONSTRAINT "channel_read_states_last_read_message_id_messages_id_fk" FOREIGN KEY ("last_read_message_id") REFERENCES "public"."messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_read_states" ADD CONSTRAINT "channel_read_states_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_attachments" ADD CONSTRAINT "message_attachments_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_attachments" ADD CONSTRAINT "message_attachments_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_edits" ADD CONSTRAINT "message_edits_editor_id_users_id_fk" FOREIGN KEY ("editor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_edits" ADD CONSTRAINT "message_edits_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_embeds" ADD CONSTRAINT "message_embeds_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_mentions" ADD CONSTRAINT "message_mentions_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_pins" ADD CONSTRAINT "message_pins_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_pins" ADD CONSTRAINT "message_pins_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_pins" ADD CONSTRAINT "message_pins_pinned_by_users_id_fk" FOREIGN KEY ("pinned_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_reply_to_message_id_messages_id_fk" FOREIGN KEY ("reply_to_message_id") REFERENCES "public"."messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_message_bookmarks" ADD CONSTRAINT "user_message_bookmarks_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_message_bookmarks" ADD CONSTRAINT "user_message_bookmarks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automod_events" ADD CONSTRAINT "automod_events_rule_id_automod_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."automod_rules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automod_events" ADD CONSTRAINT "automod_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automod_rules" ADD CONSTRAINT "automod_rules_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automod_rules" ADD CONSTRAINT "automod_rules_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_case_id_moderation_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."moderation_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_cases" ADD CONSTRAINT "moderation_cases_opened_by_users_id_fk" FOREIGN KEY ("opened_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_cases" ADD CONSTRAINT "moderation_cases_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bots" ADD CONSTRAINT "bots_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bots" ADD CONSTRAINT "bots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_installations" ADD CONSTRAINT "integration_installations_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_installations" ADD CONSTRAINT "integration_installations_installed_by_users_id_fk" FOREIGN KEY ("installed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_installations" ADD CONSTRAINT "integration_installations_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_webhook_id_channel_webhooks_id_fk" FOREIGN KEY ("webhook_id") REFERENCES "public"."channel_webhooks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_bans" ADD CONSTRAINT "server_bans_moderator_id_users_id_fk" FOREIGN KEY ("moderator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_bans" ADD CONSTRAINT "server_bans_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_bans" ADD CONSTRAINT "server_bans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_emojis" ADD CONSTRAINT "server_emojis_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_emojis" ADD CONSTRAINT "server_emojis_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_invites" ADD CONSTRAINT "server_invites_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_invites" ADD CONSTRAINT "server_invites_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_member_profiles" ADD CONSTRAINT "server_member_profiles_member_id_server_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."server_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_member_roles" ADD CONSTRAINT "server_member_roles_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_member_roles" ADD CONSTRAINT "server_member_roles_member_id_server_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."server_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_member_roles" ADD CONSTRAINT "server_member_roles_role_id_server_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."server_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_members" ADD CONSTRAINT "server_members_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_members" ADD CONSTRAINT "server_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_roles" ADD CONSTRAINT "server_roles_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "servers" ADD CONSTRAINT "servers_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_session_participants" ADD CONSTRAINT "voice_session_participants_session_id_voice_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."voice_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_session_participants" ADD CONSTRAINT "voice_session_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_sessions" ADD CONSTRAINT "voice_sessions_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "channel_members_user_id_idx" ON "channel_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "channel_permission_overwrites_subject_idx" ON "channel_permission_overwrites" USING btree ("subject_type","subject_id");--> statement-breakpoint
CREATE INDEX "channel_webhooks_channel_id_idx" ON "channel_webhooks" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "channel_webhooks_creator_id_idx" ON "channel_webhooks" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "channels_server_tree_idx" ON "channels" USING btree ("server_id","parent_id","position_key") WHERE "channels"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "channels_parent_id_idx" ON "channels" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "channels_owner_id_idx" ON "channels" USING btree ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "direct_conversations_pair_unique" ON "direct_conversations" USING btree ("lower_user_id","higher_user_id");--> statement-breakpoint
CREATE INDEX "direct_conversations_higher_user_idx" ON "direct_conversations" USING btree ("higher_user_id");--> statement-breakpoint
CREATE INDEX "forum_post_tags_tag_id_idx" ON "forum_post_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "forum_tags_channel_name_unique" ON "forum_tags" USING btree ("channel_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "file_variants_file_type_unique" ON "file_variants" USING btree ("file_id","type");--> statement-breakpoint
CREATE UNIQUE INDEX "file_variants_object_key_unique" ON "file_variants" USING btree ("object_key");--> statement-breakpoint
CREATE UNIQUE INDEX "files_object_key_unique" ON "files" USING btree ("object_key");--> statement-breakpoint
CREATE INDEX "files_owner_id_idx" ON "files" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "files_server_id_idx" ON "files" USING btree ("server_id");--> statement-breakpoint
CREATE INDEX "files_pending_cleanup_idx" ON "files" USING btree ("created_at") WHERE "files"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "auth_identities_user_id_idx" ON "auth_identities" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_identities_provider_subject_unique" ON "auth_identities" USING btree ("provider","provider_subject");--> statement-breakpoint
CREATE INDEX "user_blocks_blocked_id_idx" ON "user_blocks" USING btree ("blocked_id");--> statement-breakpoint
CREATE INDEX "user_devices_user_id_idx" ON "user_devices" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_relationships_addressee_idx" ON "user_relationships" USING btree ("addressee_id","status");--> statement-breakpoint
CREATE INDEX "user_sessions_active_user_idx" ON "user_sessions" USING btree ("user_id","expires_at") WHERE "user_sessions"."revoked_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "user_sessions_refresh_token_hash_unique" ON "user_sessions" USING btree ("refresh_token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_active_handle_unique" ON "users" USING btree ("normalized_handle") WHERE "users"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "channel_read_states_user_id_idx" ON "channel_read_states" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "channel_read_states_last_message_idx" ON "channel_read_states" USING btree ("last_read_message_id");--> statement-breakpoint
CREATE INDEX "message_attachments_file_id_idx" ON "message_attachments" USING btree ("file_id");--> statement-breakpoint
CREATE INDEX "message_edits_message_time_idx" ON "message_edits" USING btree ("message_id","edited_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "message_edits_editor_id_idx" ON "message_edits" USING btree ("editor_id");--> statement-breakpoint
CREATE INDEX "message_embeds_message_id_idx" ON "message_embeds" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "message_mentions_subject_idx" ON "message_mentions" USING btree ("subject_type","subject_id");--> statement-breakpoint
CREATE INDEX "message_pins_channel_time_idx" ON "message_pins" USING btree ("channel_id","pinned_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "message_pins_pinned_by_idx" ON "message_pins" USING btree ("pinned_by");--> statement-breakpoint
CREATE INDEX "message_reactions_user_id_idx" ON "message_reactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "messages_channel_history_idx" ON "messages" USING btree ("channel_id","created_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "messages_author_id_idx" ON "messages" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "messages_channel_author_time_idx" ON "messages" USING btree ("channel_id","author_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "messages_reply_to_id_idx" ON "messages" USING btree ("reply_to_message_id");--> statement-breakpoint
CREATE UNIQUE INDEX "messages_author_nonce_unique" ON "messages" USING btree ("author_id","client_nonce") WHERE "messages"."client_nonce" is not null;--> statement-breakpoint
CREATE INDEX "user_message_bookmarks_message_id_idx" ON "user_message_bookmarks" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "audit_log_server_time_idx" ON "audit_log" USING btree ("server_id","created_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "audit_log_actor_id_idx" ON "audit_log" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "automod_events_rule_time_idx" ON "automod_events" USING btree ("rule_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "automod_events_user_id_idx" ON "automod_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "automod_rules_server_id_idx" ON "automod_rules" USING btree ("server_id");--> statement-breakpoint
CREATE INDEX "automod_rules_created_by_idx" ON "automod_rules" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "moderation_actions_case_time_idx" ON "moderation_actions" USING btree ("case_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "moderation_actions_actor_id_idx" ON "moderation_actions" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "moderation_cases_server_status_idx" ON "moderation_cases" USING btree ("server_id","status","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "moderation_cases_opened_by_idx" ON "moderation_cases" USING btree ("opened_by");--> statement-breakpoint
CREATE INDEX "user_reports_status_time_idx" ON "user_reports" USING btree ("status","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "user_reports_reporter_id_idx" ON "user_reports" USING btree ("reporter_id");--> statement-breakpoint
CREATE INDEX "user_reports_server_id_idx" ON "user_reports" USING btree ("server_id");--> statement-breakpoint
CREATE INDEX "applications_owner_id_idx" ON "applications" USING btree ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bots_application_unique" ON "bots" USING btree ("application_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bots_token_hash_unique" ON "bots" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "bots_user_id_idx" ON "bots" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "integration_installations_server_app_unique" ON "integration_installations" USING btree ("server_id","application_id");--> statement-breakpoint
CREATE INDEX "integration_installations_application_id_idx" ON "integration_installations" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "integration_installations_installed_by_idx" ON "integration_installations" USING btree ("installed_by");--> statement-breakpoint
CREATE INDEX "notification_preferences_user_id_idx" ON "notification_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_preferences_server_id_idx" ON "notification_preferences" USING btree ("server_id");--> statement-breakpoint
CREATE INDEX "notification_preferences_channel_id_idx" ON "notification_preferences" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "notifications_user_time_idx" ON "notifications" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "notifications_unread_user_idx" ON "notifications" USING btree ("user_id","created_at" DESC NULLS LAST) WHERE "notifications"."read_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "push_subscriptions_endpoint_unique" ON "push_subscriptions" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "push_subscriptions_user_id_idx" ON "push_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "webhook_deliveries_pending_idx" ON "webhook_deliveries" USING btree ("next_attempt_at","id") WHERE "webhook_deliveries"."status" in ('pending', 'failed');--> statement-breakpoint
CREATE INDEX "webhook_deliveries_webhook_id_idx" ON "webhook_deliveries" USING btree ("webhook_id");--> statement-breakpoint
CREATE INDEX "outbox_events_pending_idx" ON "outbox_events" USING btree ("available_at","id") WHERE "outbox_events"."processed_at" is null;--> statement-breakpoint
CREATE INDEX "outbox_events_aggregate_idx" ON "outbox_events" USING btree ("aggregate_type","aggregate_id");--> statement-breakpoint
CREATE INDEX "server_bans_user_id_idx" ON "server_bans" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "server_emojis_server_name_unique" ON "server_emojis" USING btree ("server_id","name");--> statement-breakpoint
CREATE INDEX "server_emojis_creator_id_idx" ON "server_emojis" USING btree ("creator_id");--> statement-breakpoint
CREATE UNIQUE INDEX "server_invites_code_hash_unique" ON "server_invites" USING btree ("code_hash");--> statement-breakpoint
CREATE INDEX "server_invites_server_id_idx" ON "server_invites" USING btree ("server_id");--> statement-breakpoint
CREATE INDEX "server_invites_creator_id_idx" ON "server_invites" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "server_member_roles_role_id_idx" ON "server_member_roles" USING btree ("role_id");--> statement-breakpoint
CREATE UNIQUE INDEX "server_members_server_user_unique" ON "server_members" USING btree ("server_id","user_id");--> statement-breakpoint
CREATE INDEX "server_members_active_user_idx" ON "server_members" USING btree ("user_id","joined_at") WHERE "server_members"."state" = 'active';--> statement-breakpoint
CREATE INDEX "server_members_server_state_idx" ON "server_members" USING btree ("server_id","state");--> statement-breakpoint
CREATE INDEX "server_roles_server_position_idx" ON "server_roles" USING btree ("server_id","position_key");--> statement-breakpoint
CREATE UNIQUE INDEX "server_roles_default_unique" ON "server_roles" USING btree ("server_id") WHERE "server_roles"."is_default" = true;--> statement-breakpoint
CREATE INDEX "servers_owner_id_idx" ON "servers" USING btree ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "servers_slug_unique" ON "servers" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "voice_participants_session_idx" ON "voice_session_participants" USING btree ("session_id","joined_at");--> statement-breakpoint
CREATE INDEX "voice_participants_user_id_idx" ON "voice_session_participants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "voice_sessions_channel_time_idx" ON "voice_sessions" USING btree ("channel_id","started_at" DESC NULLS LAST);