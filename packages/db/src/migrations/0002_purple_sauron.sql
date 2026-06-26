CREATE TABLE `patient_moods` (
	`user_id` text PRIMARY KEY NOT NULL,
	`mood` text DEFAULT 'idle' NOT NULL,
	`intensity` integer DEFAULT 3 NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `session_shared_data` (
	`session_id` text PRIMARY KEY NOT NULL,
	`encrypted_data` text,
	`patient_public_key` text,
	`doctor_public_key` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
