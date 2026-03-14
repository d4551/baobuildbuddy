PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_settings` (
	`id` text PRIMARY KEY DEFAULT 'default' NOT NULL,
	`gemini_api_key` text,
	`openai_api_key` text,
	`claude_api_key` text,
	`huggingface_token` text,
	`local_model_endpoint` text DEFAULT 'http://localhost:11434/v1',
	`local_model_name` text DEFAULT '',
	`preferred_provider` text DEFAULT 'local',
	`preferred_model` text,
	`theme` text DEFAULT 'bao-light',
	`language` text DEFAULT 'en-US',
	`notifications` text DEFAULT '{"achievements":true,"dailyChallenges":true,"levelUp":true,"jobAlerts":true}',
	`automation_settings` text DEFAULT '{"headless":true,"defaultTimeout":30,"screenshotRetention":7,"maxConcurrentRuns":1,"defaultBrowser":"chrome","enableSmartSelectors":true,"autoSaveScreenshots":true}',
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_settings`("id", "gemini_api_key", "openai_api_key", "claude_api_key", "huggingface_token", "local_model_endpoint", "local_model_name", "preferred_provider", "preferred_model", "theme", "language", "notifications", "automation_settings", "created_at", "updated_at") SELECT "id", "gemini_api_key", "openai_api_key", "claude_api_key", "huggingface_token", "local_model_endpoint", "local_model_name", "preferred_provider", "preferred_model", "theme", "language", "notifications", "automation_settings", "created_at", "updated_at" FROM `settings`;--> statement-breakpoint
DROP TABLE `settings`;--> statement-breakpoint
ALTER TABLE `__new_settings` RENAME TO `settings`;--> statement-breakpoint
PRAGMA foreign_keys=ON;