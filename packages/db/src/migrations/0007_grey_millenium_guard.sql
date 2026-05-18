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
CREATE UNIQUE INDEX `doctor_files_file_key_unique` ON `doctor_files` (`file_key`);