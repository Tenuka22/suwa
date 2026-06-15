DROP TABLE `guardian_profiles`;--> statement-breakpoint
ALTER TABLE `wellness_actions` ADD `metadata` text;--> statement-breakpoint
ALTER TABLE `patient_profiles` DROP COLUMN `guardian_user_id`;--> statement-breakpoint
ALTER TABLE `patient_profiles` DROP COLUMN `guardian_email`;--> statement-breakpoint
ALTER TABLE `patient_profiles` DROP COLUMN `guardian_phone`;--> statement-breakpoint
ALTER TABLE `patient_profiles` DROP COLUMN `guardian_request_status`;--> statement-breakpoint
ALTER TABLE `stress_download_acknowledgments` DROP COLUMN `guardian_acknowledged_at`;