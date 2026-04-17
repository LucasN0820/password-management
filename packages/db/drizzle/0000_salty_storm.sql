CREATE TABLE `passwords` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`username` text,
	`password` text NOT NULL,
	`url` text,
	`notes` text,
	`category` text DEFAULT 'all' NOT NULL,
	`favorite` integer DEFAULT false NOT NULL,
	`icon` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
