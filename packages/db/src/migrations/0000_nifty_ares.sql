CREATE TABLE `conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `clinic_attendance` (
	`id` text PRIMARY KEY NOT NULL,
	`clinic_id` text NOT NULL,
	`doctor_id` text NOT NULL,
	`date` text NOT NULL,
	`arrived_at` text,
	`left_at` text,
	`recorded_by` text NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `clinics` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`name` text NOT NULL,
	`specialization` text,
	`schedule` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `credit_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`amount` integer NOT NULL,
	`type` text NOT NULL,
	`session_id` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `doctor_cashout_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`doctor_id` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`stripe_transfer_id` text,
	`failure_reason` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `doctor_credits` (
	`doctor_id` text PRIMARY KEY NOT NULL,
	`balance_cents` integer DEFAULT 0 NOT NULL,
	`total_earned_cents` integer DEFAULT 0 NOT NULL,
	`total_cashed_out_cents` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `doctor_education_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`doctor_id` text NOT NULL,
	`institution` text NOT NULL,
	`degree` text NOT NULL,
	`year` integer,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `doctor_files` (
	`id` text PRIMARY KEY NOT NULL,
	`doctor_id` text NOT NULL,
	`file_key` text NOT NULL,
	`file_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`file_kind` text NOT NULL,
	`caption` text,
	`size` integer NOT NULL,
	`width` integer,
	`height` integer,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `doctor_files_file_key_unique` ON `doctor_files` (`file_key`);--> statement-breakpoint
CREATE TABLE `doctor_hospital_affiliations` (
	`id` text PRIMARY KEY NOT NULL,
	`doctor_id` text NOT NULL,
	`tenant_id` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`availability_windows` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `doctor_hospital_affiliations_doctor_tenant_unique` ON `doctor_hospital_affiliations` (`doctor_id`,`tenant_id`);--> statement-breakpoint
CREATE TABLE `doctor_hospital_invitations` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`doctor_id` text NOT NULL,
	`invited_by` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`message` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `doctor_hospital_invitations_tenant_doctor_unique` ON `doctor_hospital_invitations` (`tenant_id`,`doctor_id`);--> statement-breakpoint
CREATE TABLE `doctor_hub_channels` (
	`id` text PRIMARY KEY NOT NULL,
	`doctor_id` text NOT NULL,
	`name` text NOT NULL,
	`handle` text NOT NULL,
	`description` text,
	`avatar_key` text,
	`banner_key` text,
	`is_default` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `doctor_hub_materials` (
	`id` text PRIMARY KEY NOT NULL,
	`doctor_id` text NOT NULL,
	`channel_id` text,
	`title` text NOT NULL,
	`description` text,
	`content` text,
	`file_key` text,
	`thumbnail_key` text,
	`file_type` text NOT NULL,
	`file_name` text,
	`mime_type` text,
	`size` integer,
	`duration_seconds` integer,
	`visibility` text DEFAULT 'private' NOT NULL,
	`status` text DEFAULT 'uploading' NOT NULL,
	`tags` text,
	`metadata` text,
	`playlist_id` text,
	`is_individual` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `doctor_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`doctor_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`credit_cost` integer DEFAULT 1 NOT NULL,
	`duration_minutes` integer NOT NULL,
	`features` text,
	`is_active` integer DEFAULT true NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `doctor_playlists` (
	`id` text PRIMARY KEY NOT NULL,
	`doctor_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `doctor_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`display_name` text,
	`headline` text,
	`bio` text,
	`license_number` text,
	`location` text,
	`place_name` text,
	`place_address` text,
	`place_description` text,
	`experience_start_year` integer,
	`specialties` text,
	`languages` text,
	`consultation_modes` text,
	`focus_areas` text,
	`approach_steps` text,
	`approach` text,
	`education` text,
	`permanent` integer DEFAULT false NOT NULL,
	`stripe_account_id` text,
	`stripe_account_enabled` integer DEFAULT false,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `doctor_schedule_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`doctor_id` text NOT NULL,
	`kind` text NOT NULL,
	`note_kind` text,
	`start_at` text NOT NULL,
	`end_at` text NOT NULL,
	`session_id` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `doctor_schedule_entries_session_id_unique` ON `doctor_schedule_entries` (`session_id`);--> statement-breakpoint
CREATE TABLE `doctor_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`doctor_id` text NOT NULL,
	`patient_id` text NOT NULL,
	`plan_id` text,
	`start_at` text NOT NULL,
	`end_at` text NOT NULL,
	`status` text DEFAULT 'requested' NOT NULL,
	`credit_cost` integer NOT NULL,
	`doctor_earned_cents` integer,
	`payout_status` text DEFAULT 'none' NOT NULL,
	`payout_transfer_id` text,
	`payout_amount` integer,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `doctor_weekly_availability` (
	`id` text PRIMARY KEY NOT NULL,
	`doctor_id` text NOT NULL,
	`day_of_week` integer NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`is_available` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `guardian_profiles` (
	`clerk_user_id` text PRIMARY KEY NOT NULL,
	`email` text,
	`phone` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `guardian_email_unique` ON `guardian_profiles` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `guardian_phone_unique` ON `guardian_profiles` (`phone`);--> statement-breakpoint
CREATE TABLE `hospital_attendance_events` (
	`id` text PRIMARY KEY NOT NULL,
	`doctor_id` text NOT NULL,
	`tenant_id` text NOT NULL,
	`clinic_id` text,
	`timestamp` text NOT NULL,
	`event_type` text NOT NULL,
	`note` text,
	`recorded_by` text NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `hospital_availability_overrides` (
	`id` text PRIMARY KEY NOT NULL,
	`doctor_id` text NOT NULL,
	`tenant_id` text NOT NULL,
	`start_at` text NOT NULL,
	`end_at` text NOT NULL,
	`reason` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `hub_upload_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`doctor_id` text NOT NULL,
	`material_id` text,
	`file_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`total_size` integer NOT NULL,
	`chunk_size` integer NOT NULL,
	`total_chunks` integer NOT NULL,
	`uploaded_chunks` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`file_key` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `moonlight_credit_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`amount` integer NOT NULL,
	`type` text NOT NULL,
	`reason` text NOT NULL,
	`wellness_action_id` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `moonlight_credits` (
	`user_id` text PRIMARY KEY NOT NULL,
	`balance` integer DEFAULT 0 NOT NULL,
	`total_earned` integer DEFAULT 0 NOT NULL,
	`consistency_score` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `patient_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`alias` text NOT NULL,
	`guardian_user_id` text,
	`guardian_email` text,
	`guardian_phone` text,
	`guardian_request_status` text,
	`is_onboarding_complete` integer DEFAULT false NOT NULL,
	`_secured_data` text,
	`secured` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `session_attendance_events` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`participant_id` text NOT NULL,
	`participant_type` text NOT NULL,
	`event` text NOT NULL,
	`timestamp` text NOT NULL,
	`metadata` text
);
--> statement-breakpoint
CREATE TABLE `session_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`captured_at` text NOT NULL,
	`image_url` text,
	`image_data` text,
	`participant_type` text NOT NULL,
	`reason` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `session_task_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`doctor_id` text NOT NULL,
	`patient_id` text NOT NULL,
	`task_key` text NOT NULL,
	`title` text NOT NULL,
	`minutes` integer NOT NULL,
	`points` integer NOT NULL,
	`reward_label` text NOT NULL,
	`status` text DEFAULT 'assigned' NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sprite_states` (
	`user_id` text PRIMARY KEY NOT NULL,
	`health` integer DEFAULT 100 NOT NULL,
	`mood` text DEFAULT 'idle' NOT NULL,
	`streak_days` integer DEFAULT 0 NOT NULL,
	`last_interaction_at` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `stress_download_acknowledgments` (
	`user_id` text PRIMARY KEY NOT NULL,
	`patient_acknowledged_at` text,
	`guardian_acknowledged_at` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `stress_predictions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`prediction` text NOT NULL,
	`predicted_class` text,
	`probabilities` text,
	`sample_count` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tenant_admins` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tenant_admins_tenant_user_unique` ON `tenant_admins` (`tenant_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `tenant_audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`actor_id` text NOT NULL,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`details` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tenant_notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`entity_id` text,
	`is_read` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`address` text NOT NULL,
	`contact_info` text,
	`logo` text,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`services` text,
	`latitude` text,
	`longitude` text,
	`phone` text,
	`website` text,
	`place_data_ref` text,
	`created_by` text NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_credits` (
	`user_id` text PRIMARY KEY NOT NULL,
	`balance` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`plan_id` text NOT NULL,
	`stripe_subscription_id` text,
	`status` text DEFAULT 'active' NOT NULL,
	`current_period_start` text,
	`current_period_end` text,
	`cancel_at_period_end` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `wellness_actions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`action_type` text NOT NULL,
	`completed_at` text NOT NULL,
	`duration_seconds` integer,
	`credits_earned` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
