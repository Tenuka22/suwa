ALTER TABLE `doctor_profiles` ADD `stripe_account_id` text;--> statement-breakpoint
ALTER TABLE `doctor_profiles` ADD `stripe_account_enabled` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `doctor_sessions` ADD `payout_status` text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `doctor_sessions` ADD `payout_transfer_id` text;--> statement-breakpoint
ALTER TABLE `doctor_sessions` ADD `payout_amount` integer;