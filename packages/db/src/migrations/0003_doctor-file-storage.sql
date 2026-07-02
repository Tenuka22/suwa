CREATE TABLE `stored_files` (
	`key` text PRIMARY KEY NOT NULL,
	`data_base64` text NOT NULL,
	`mime_type` text NOT NULL,
	`size` integer NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
ALTER TABLE `doctor_files` ADD `thumbnail_key` text;