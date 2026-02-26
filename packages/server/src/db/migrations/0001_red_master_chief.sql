PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_automation_runs` (
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
	`exit_code` integer,
	`timed_out` integer DEFAULT false NOT NULL,
	`aborted` integer DEFAULT false NOT NULL,
	`execution_ms` integer,
	`started_at` text,
	`completed_at` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_automation_runs`("id", "type", "status", "job_id", "user_id", "input", "output", "screenshots", "error", "progress", "current_step", "total_steps", "exit_code", "timed_out", "aborted", "execution_ms", "started_at", "completed_at", "created_at", "updated_at") SELECT "id", "type", "status", "job_id", "user_id", "input", "output", "screenshots", "error", "progress", "current_step", "total_steps", "exit_code", "timed_out", "aborted", "execution_ms", "started_at", "completed_at", "created_at", "updated_at" FROM `automation_runs`;--> statement-breakpoint
DROP TABLE `automation_runs`;--> statement-breakpoint
ALTER TABLE `__new_automation_runs` RENAME TO `automation_runs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;