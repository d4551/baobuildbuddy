/**
 * Environment variable parse bounds.
 * Single source of truth for min/max/default values used by parseBoundedInt in server config.
 */

import { DEFAULT_AUTOMATION_SETTINGS } from "../types/settings";
import { RPA_STDIO_BUFFER_LIMIT } from "../schemas/rpa-protocol.schema";

/** Automation script timeout: min 1s, max 30min. Default from automation settings (seconds → ms). */
export const ENV_AUTOMATION_SCRIPT_TIMEOUT_MS_DEFAULT =
  DEFAULT_AUTOMATION_SETTINGS.defaultTimeout * 1_000;
export const ENV_AUTOMATION_SCRIPT_TIMEOUT_MS_MIN = 1_000;
export const ENV_AUTOMATION_SCRIPT_TIMEOUT_MS_MAX = 1_800_000;

/** Automation stdio buffer limit: min 10, max 2000 lines. */
export const ENV_AUTOMATION_STDIO_BUFFER_LIMIT_DEFAULT = RPA_STDIO_BUFFER_LIMIT;
export const ENV_AUTOMATION_STDIO_BUFFER_LIMIT_MIN = 10;
export const ENV_AUTOMATION_STDIO_BUFFER_LIMIT_MAX = 2_000;

/** Smart field mapper retries: min 1, max 5. */
export const ENV_SMART_FIELD_MAPPER_RETRIES_DEFAULT = 2;
export const ENV_SMART_FIELD_MAPPER_RETRIES_MIN = 1;
export const ENV_SMART_FIELD_MAPPER_RETRIES_MAX = 5;

/** Smart field mapper retry delay: min 50ms, max 5s. */
export const ENV_SMART_FIELD_MAPPER_RETRY_DELAY_MS_DEFAULT = 500;
export const ENV_SMART_FIELD_MAPPER_RETRY_DELAY_MS_MIN = 50;
export const ENV_SMART_FIELD_MAPPER_RETRY_DELAY_MS_MAX = 5_000;

/** Smart field mapper fetch timeout: min 500ms, max 2min. */
export const ENV_SMART_FIELD_MAPPER_FETCH_TIMEOUT_MS_DEFAULT = 10_000;
export const ENV_SMART_FIELD_MAPPER_FETCH_TIMEOUT_MS_MIN = 500;
export const ENV_SMART_FIELD_MAPPER_FETCH_TIMEOUT_MS_MAX = 120_000;

/** Smart field mapper max form HTML chars: min 500, max 100k. */
export const ENV_SMART_FIELD_MAPPER_MAX_FORM_HTML_CHARS_DEFAULT = 4_000;
export const ENV_SMART_FIELD_MAPPER_MAX_FORM_HTML_CHARS_MIN = 500;
export const ENV_SMART_FIELD_MAPPER_MAX_FORM_HTML_CHARS_MAX = 100_000;

/** Default User-Agent for smart field mapper HTTP requests. */
export const ENV_SMART_FIELD_MAPPER_USER_AGENT_DEFAULT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
