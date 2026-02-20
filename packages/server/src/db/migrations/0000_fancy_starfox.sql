CREATE TABLE `auth` (
	`id` text PRIMARY KEY DEFAULT 'default' NOT NULL,
	`api_key` text
);
--> statement-breakpoint
CREATE TABLE `user_profile` (
	`id` text PRIMARY KEY DEFAULT 'default' NOT NULL,
	`name` text DEFAULT '' NOT NULL,
	`email` text,
	`phone` text,
	`location` text,
	`website` text,
	`linkedin` text,
	`github` text,
	`summary` text,
	`current_role` text,
	`current_company` text,
	`years_experience` integer,
	`technical_skills` text DEFAULT '[]',
	`soft_skills` text DEFAULT '[]',
	`gaming_experience` text DEFAULT '{}',
	`career_goals` text DEFAULT '{}',
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY DEFAULT 'default' NOT NULL,
	`gemini_api_key` text,
	`openai_api_key` text,
	`claude_api_key` text,
	`huggingface_token` text,
	`local_model_endpoint` text DEFAULT 'http://localhost:8080/v1',
	`local_model_name` text DEFAULT 'llama3.2',
	`preferred_provider` text DEFAULT 'local',
	`preferred_model` text,
	`theme` text DEFAULT 'bao-light',
	`language` text DEFAULT 'en',
	`notifications` text DEFAULT '{"achievements":true,"dailyChallenges":true,"levelUp":true,"jobAlerts":true}',
	`automation_settings` text DEFAULT '{"headless":true,"defaultTimeout":30,"screenshotRetention":7,"maxConcurrentRuns":1,"defaultBrowser":"chrome","enableSmartSelectors":true,"autoSaveScreenshots":true}',
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `applications` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`status` text DEFAULT 'applied',
	`applied_date` text NOT NULL,
	`notes` text DEFAULT '',
	`timeline` text DEFAULT '[]',
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `applications_job_id_idx` ON `applications` (`job_id`);--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`company` text NOT NULL,
	`location` text NOT NULL,
	`remote` integer DEFAULT false,
	`hybrid` integer DEFAULT false,
	`salary` text,
	`description` text,
	`requirements` text,
	`technologies` text,
	`experience_level` text,
	`type` text DEFAULT 'full-time',
	`posted_date` text,
	`url` text,
	`source` text,
	`studio_type` text,
	`game_genres` text,
	`platforms` text,
	`content_hash` text,
	`tags` text,
	`company_logo` text,
	`application_url` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `jobs_source_idx` ON `jobs` (`source`);--> statement-breakpoint
CREATE INDEX `jobs_posted_date_idx` ON `jobs` (`posted_date`);--> statement-breakpoint
CREATE UNIQUE INDEX `jobs_content_hash_idx` ON `jobs` (`content_hash`);--> statement-breakpoint
CREATE TABLE `saved_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`saved_at` text NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `saved_jobs_job_id_idx` ON `saved_jobs` (`job_id`);--> statement-breakpoint
CREATE TABLE `resumes` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text DEFAULT 'Untitled Resume',
	`personal_info` text,
	`summary` text,
	`experience` text DEFAULT '[]',
	`education` text DEFAULT '[]',
	`skills` text,
	`projects` text DEFAULT '[]',
	`gaming_experience` text,
	`template` text DEFAULT 'modern',
	`theme` text DEFAULT 'light',
	`is_default` integer DEFAULT false,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `cover_letters` (
	`id` text PRIMARY KEY NOT NULL,
	`company` text NOT NULL,
	`position` text NOT NULL,
	`job_info` text,
	`content` text DEFAULT '{}',
	`template` text DEFAULT 'professional',
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `portfolio_projects` (
	`id` text PRIMARY KEY NOT NULL,
	`portfolio_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`technologies` text DEFAULT '[]',
	`image` text,
	`live_url` text,
	`github_url` text,
	`tags` text DEFAULT '[]',
	`featured` integer DEFAULT false,
	`role` text,
	`platforms` text,
	`engines` text,
	`sort_order` integer DEFAULT 0,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`portfolio_id`) REFERENCES `portfolios`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `portfolio_projects_portfolio_id_idx` ON `portfolio_projects` (`portfolio_id`);--> statement-breakpoint
CREATE TABLE `portfolios` (
	`id` text PRIMARY KEY NOT NULL,
	`metadata` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `interview_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`studio_id` text NOT NULL,
	`config` text,
	`questions` text DEFAULT '[]',
	`responses` text DEFAULT '[]',
	`final_analysis` text,
	`status` text DEFAULT 'preparing',
	`start_time` integer,
	`end_time` integer,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `interview_sessions_studio_id_idx` ON `interview_sessions` (`studio_id`);--> statement-breakpoint
CREATE TABLE `studios` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`logo` text,
	`website` text,
	`location` text,
	`size` text,
	`type` text,
	`description` text,
	`games` text DEFAULT '[]',
	`technologies` text DEFAULT '[]',
	`culture` text,
	`interview_style` text,
	`remote_work` integer,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `gamification` (
	`id` text PRIMARY KEY DEFAULT 'default' NOT NULL,
	`xp` integer DEFAULT 0,
	`level` integer DEFAULT 1,
	`achievements` text DEFAULT '[]',
	`daily_challenges` text DEFAULT '{}',
	`longest_streak` integer DEFAULT 0,
	`current_streak` integer DEFAULT 0,
	`last_active_date` text,
	`stats` text DEFAULT '{}',
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `skill_mappings` (
	`id` text PRIMARY KEY NOT NULL,
	`game_expression` text NOT NULL,
	`transferable_skill` text NOT NULL,
	`industry_applications` text DEFAULT '[]',
	`evidence` text DEFAULT '[]',
	`confidence` integer DEFAULT 50,
	`category` text,
	`demand_level` text DEFAULT 'medium',
	`ai_generated` integer DEFAULT false,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `chat_history` (
	`id` text PRIMARY KEY NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`timestamp` text NOT NULL,
	`session_id` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `chat_history_session_id_idx` ON `chat_history` (`session_id`);--> statement-breakpoint
CREATE INDEX `chat_history_timestamp_idx` ON `chat_history` (`timestamp`);--> statement-breakpoint
CREATE TABLE `automation_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`job_id` text,
	`user_id` text,
	`input` text,
	`output` text,
	`screenshots` text,
	`error` text,
	`progress` integer DEFAULT 0,
	`current_step` integer,
	`total_steps` integer,
	`started_at` text,
	`completed_at` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
