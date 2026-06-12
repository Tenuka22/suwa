PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `doctor_hub_materials` (
	`id` text PRIMARY KEY NOT NULL,
	`doctor_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`content` text,
	`file_key` text,
	`file_type` text NOT NULL,
	`tags` text,
	`metadata` text,
	`playlist_id` text,
	`is_individual` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);--> statement-breakpoint
CREATE TABLE `doctor_playlists` (
	`id` text PRIMARY KEY NOT NULL,
	`doctor_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
