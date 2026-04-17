export const passwordMigrations = {
  "journal": {
    "version": "7",
    "dialect": "sqlite",
    "entries": [
      {
        "idx": 0,
        "version": "6",
        "when": 1776434060655,
        "tag": "0000_salty_storm",
        "breakpoints": true
      },
      {
        "idx": 1,
        "version": "6",
        "when": 1776434153575,
        "tag": "0001_fine_wonder_man",
        "breakpoints": true
      }
    ]
  },
  "migrations": {
    "m0000": "CREATE TABLE `passwords` (\n\t`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,\n\t`title` text NOT NULL,\n\t`username` text,\n\t`password` text NOT NULL,\n\t`url` text,\n\t`notes` text,\n\t`category` text DEFAULT 'all' NOT NULL,\n\t`favorite` integer DEFAULT false NOT NULL,\n\t`icon` text,\n\t`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,\n\t`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL\n);\n",
    "m0001": "CREATE INDEX `idx_passwords_category` ON `passwords` (`category`);--> statement-breakpoint\nCREATE INDEX `idx_passwords_favorite` ON `passwords` (`favorite`);"
  }
} as const
