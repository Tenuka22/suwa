ALTER TABLE `doctor_profiles` ADD `face_embedding_kv_key` text;--> statement-breakpoint
ALTER TABLE `doctor_profiles` DROP COLUMN `face_embedding`;