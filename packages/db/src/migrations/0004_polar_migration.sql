ALTER TABLE `doctor_profiles` RENAME COLUMN `stripe_account_id` TO `polar_payout_account_id`;
--> statement-breakpoint
ALTER TABLE `doctor_profiles` RENAME COLUMN `stripe_account_enabled` TO `polar_payout_account_enabled`;
--> statement-breakpoint
ALTER TABLE `doctor_sessions` RENAME COLUMN `payment_intent_id` TO `polar_order_id`;
--> statement-breakpoint
ALTER TABLE `doctor_cashout_requests` RENAME COLUMN `stripe_transfer_id` TO `polar_transfer_id`;
--> statement-breakpoint
ALTER TABLE `user_subscriptions` RENAME COLUMN `stripe_subscription_id` TO `polar_subscription_id`;
