ALTER TABLE `patient_profiles` ADD `age_category` text DEFAULT 'adult' NOT NULL;--> statement-breakpoint
ALTER TABLE `patient_profiles` ADD `profession` text DEFAULT 'other' NOT NULL;