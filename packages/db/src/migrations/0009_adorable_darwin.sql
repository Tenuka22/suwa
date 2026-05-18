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
ALTER TABLE `doctor_profiles` ADD `place_name` text;--> statement-breakpoint
ALTER TABLE `doctor_profiles` ADD `place_address` text;--> statement-breakpoint
ALTER TABLE `doctor_profiles` ADD `place_description` text;--> statement-breakpoint
ALTER TABLE `doctor_profiles` ADD `experience_start_year` integer;--> statement-breakpoint
ALTER TABLE `doctor_profiles` ADD `approach_steps` text;--> statement-breakpoint
ALTER TABLE `doctor_profiles` DROP COLUMN `years_experience`;