ALTER TABLE `doctor_profiles` ADD `stripe_account_id` text;--> statement-breakpoint
ALTER TABLE `doctor_profiles` ADD `stripe_account_enabled` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `doctor_sessions` ADD `payment_intent_id` text;
