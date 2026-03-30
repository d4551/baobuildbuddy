import {
  DEFAULT_AI_ROUTING,
  DEFAULT_EMAIL_TRANSPORT_SETTINGS,
} from "@bao/shared";

const escapeSqlString = (value: string): string => value.replaceAll("'", "''");
const DEFAULT_AI_ROUTING_SQL = escapeSqlString(JSON.stringify(DEFAULT_AI_ROUTING));
const DEFAULT_EMAIL_TRANSPORT_SETTINGS_SQL = escapeSqlString(
  JSON.stringify(DEFAULT_EMAIL_TRANSPORT_SETTINGS),
);

export const AUTOMATION_RUNS_TABLE_NAME = "automation_runs";
export const SETTINGS_TABLE_NAME = "settings";
export const JOBS_TABLE_NAME = "jobs";
export const STUDIOS_TABLE_NAME = "studios";

export const AUTOMATION_RUNS_REQUIRED_COLUMNS = {
  exit_code: "INTEGER",
  timed_out: "INTEGER NOT NULL DEFAULT 0",
  aborted: "INTEGER NOT NULL DEFAULT 0",
  execution_ms: "INTEGER",
} as const;

export const SETTINGS_REQUIRED_COLUMNS = {
  ai_routing: `TEXT DEFAULT '${DEFAULT_AI_ROUTING_SQL}'`,
  email_transport_settings: `TEXT DEFAULT '${DEFAULT_EMAIL_TRANSPORT_SETTINGS_SQL}'`,
  email_transport_password: "TEXT",
} as const;

export const JOBS_REQUIRED_COLUMNS = {
  enrichment: "TEXT",
} as const;

export const STUDIOS_REQUIRED_COLUMNS = {
  enrichment: "TEXT",
} as const;
