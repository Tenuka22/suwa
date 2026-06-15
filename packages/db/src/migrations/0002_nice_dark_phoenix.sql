CREATE TABLE `sprite_collections` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`icon_name` text NOT NULL,
	`rarity` text DEFAULT 'common' NOT NULL,
	`count` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sprite_inventory` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`item_id` text NOT NULL,
	`quantity` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
