PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_guardian_profiles` (
	`clerk_user_id` text PRIMARY KEY NOT NULL,
	`email` text,
	`phone` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_guardian_profiles`("clerk_user_id", "email", "phone", "created_at", "updated_at") SELECT "clerk_user_id", "email", "phone", "created_at", "updated_at" FROM `guardian_profiles`;--> statement-breakpoint
DROP TABLE `guardian_profiles`;--> statement-breakpoint
ALTER TABLE `__new_guardian_profiles` RENAME TO `guardian_profiles`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `guardian_email_unique` ON `guardian_profiles` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `guardian_phone_unique` ON `guardian_profiles` (`phone`);