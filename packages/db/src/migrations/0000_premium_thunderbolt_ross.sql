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
	`user_id` text PRIMARY KEY NOT NULL,
	`clerk_user_id` text,
	`email` text NOT NULL,
	`phone` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `guardian_email_unique` ON `guardian_profiles` (`email`);--> statement-breakpoint
CREATE TABLE `patient_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`alias` text NOT NULL,
	`phone` text,
	`email` text,
	`guardian_user_id` text,
	`guardian_email` text,
	`guardian_phone` text,
	`guardian_request_status` text,
	`is_onboarding_complete` integer DEFAULT false NOT NULL,
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
