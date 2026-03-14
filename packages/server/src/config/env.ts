import {
  API_ERROR_INVALID_PORT,
  DEFAULT_CORS_ORIGINS,
  ENV_AUTOMATION_SCRIPT_TIMEOUT_MS_DEFAULT,
  ENV_AUTOMATION_SCRIPT_TIMEOUT_MS_MAX,
  ENV_AUTOMATION_SCRIPT_TIMEOUT_MS_MIN,
  ENV_AUTOMATION_STDIO_BUFFER_LIMIT_DEFAULT,
  ENV_AUTOMATION_STDIO_BUFFER_LIMIT_MAX,
  ENV_AUTOMATION_STDIO_BUFFER_LIMIT_MIN,
  ENV_SMART_FIELD_MAPPER_FETCH_TIMEOUT_MS_DEFAULT,
  ENV_SMART_FIELD_MAPPER_FETCH_TIMEOUT_MS_MAX,
  ENV_SMART_FIELD_MAPPER_FETCH_TIMEOUT_MS_MIN,
  ENV_SMART_FIELD_MAPPER_MAX_FORM_HTML_CHARS_DEFAULT,
  ENV_SMART_FIELD_MAPPER_MAX_FORM_HTML_CHARS_MAX,
  ENV_SMART_FIELD_MAPPER_MAX_FORM_HTML_CHARS_MIN,
  ENV_SMART_FIELD_MAPPER_RETRIES_DEFAULT,
  ENV_SMART_FIELD_MAPPER_RETRIES_MAX,
  ENV_SMART_FIELD_MAPPER_RETRIES_MIN,
  ENV_SMART_FIELD_MAPPER_RETRY_DELAY_MS_DEFAULT,
  ENV_SMART_FIELD_MAPPER_RETRY_DELAY_MS_MAX,
  ENV_SMART_FIELD_MAPPER_RETRY_DELAY_MS_MIN,
  ENV_SMART_FIELD_MAPPER_USER_AGENT_DEFAULT,
  MAX_PORT,
  MIN_PORT,
  DEFAULT_SERVER_PORT,
  DEFAULT_CLIENT_DEV_PORT,
  DEFAULT_DB_PATH_TILDE,
} from "@bao/shared";

const configuredServerPort = [Bun.env.SERVER_PORT, Bun.env.PORT].find(
  (value) => value?.trim().length,
);
const portSource = configuredServerPort ?? `${DEFAULT_SERVER_PORT}`;
const port = Number.parseInt(portSource, 10);
if (Number.isNaN(port) || port < MIN_PORT || port > MAX_PORT) {
  throw new Error(`${API_ERROR_INVALID_PORT}: ${portSource}`);
}

function parseBoundedInt(
  value: string | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(Math.max(parsed, min), max);
}

function parseNonEmptyString(value: string | undefined, fallback: string): string {
  if (!value) {
    return fallback;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function parseCorsOrigins(value?: string): string[] {
  if (!value?.trim()) {
    return [...DEFAULT_CORS_ORIGINS];
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const host = Bun.env.HOST || "0.0.0.0";
const disableAuthEnv = Bun.env.BAO_DISABLE_AUTH;
const configuredClientPort = [Bun.env.CLIENT_PORT, Bun.env.NUXT_CLIENT_PORT].find(
  (value) => value?.trim().length,
);
const clientPort = parseBoundedInt(
  configuredClientPort,
  DEFAULT_CLIENT_DEV_PORT,
  MIN_PORT,
  MAX_PORT,
);
const isProduction = process.env.NODE_ENV === "production";
const parsedCorsOrigins = parseCorsOrigins(Bun.env.CORS_ORIGINS);
const resolvedCorsOrigins = isProduction
  ? parsedCorsOrigins
  : (() => {
      const uniqueOrigins = new Set(parsedCorsOrigins);
      const localPorts = [port, clientPort];
      for (const localPort of localPorts) {
        const localPortValue = `${localPort}`;
        uniqueOrigins.add(`http://localhost:${localPortValue}`);
        uniqueOrigins.add(`http://127.0.0.1:${localPortValue}`);
      }
      return [...uniqueOrigins];
    })();
/** Skip auth when explicitly disabled or binding only to localhost */
const isLocalhostOnly = host === "127.0.0.1" || host === "localhost" || host === "::1";

export const config = {
  port,
  host,
  dbPath: Bun.env.DB_PATH || DEFAULT_DB_PATH_TILDE,
  logLevel: Bun.env.LOG_LEVEL || "info",
  corsOrigins: resolvedCorsOrigins,
  /** When true, skip API key auth (local dev only) */
  disableAuth: disableAuthEnv === "true" || disableAuthEnv === "1" || isLocalhostOnly,
  automationScriptTimeoutMs: parseBoundedInt(
    Bun.env.AUTOMATION_SCRIPT_TIMEOUT_MS,
    ENV_AUTOMATION_SCRIPT_TIMEOUT_MS_DEFAULT,
    ENV_AUTOMATION_SCRIPT_TIMEOUT_MS_MIN,
    ENV_AUTOMATION_SCRIPT_TIMEOUT_MS_MAX,
  ),
  automationStdioBufferLimit: parseBoundedInt(
    Bun.env.AUTOMATION_STDIO_BUFFER_LIMIT,
    ENV_AUTOMATION_STDIO_BUFFER_LIMIT_DEFAULT,
    ENV_AUTOMATION_STDIO_BUFFER_LIMIT_MIN,
    ENV_AUTOMATION_STDIO_BUFFER_LIMIT_MAX,
  ),
  smartFieldMapperRetries: parseBoundedInt(
    Bun.env.SMART_FIELD_MAPPER_RETRIES,
    ENV_SMART_FIELD_MAPPER_RETRIES_DEFAULT,
    ENV_SMART_FIELD_MAPPER_RETRIES_MIN,
    ENV_SMART_FIELD_MAPPER_RETRIES_MAX,
  ),
  smartFieldMapperRetryDelayMs: parseBoundedInt(
    Bun.env.SMART_FIELD_MAPPER_RETRY_DELAY_MS,
    ENV_SMART_FIELD_MAPPER_RETRY_DELAY_MS_DEFAULT,
    ENV_SMART_FIELD_MAPPER_RETRY_DELAY_MS_MIN,
    ENV_SMART_FIELD_MAPPER_RETRY_DELAY_MS_MAX,
  ),
  smartFieldMapperFetchTimeoutMs: parseBoundedInt(
    Bun.env.SMART_FIELD_MAPPER_FETCH_TIMEOUT_MS,
    ENV_SMART_FIELD_MAPPER_FETCH_TIMEOUT_MS_DEFAULT,
    ENV_SMART_FIELD_MAPPER_FETCH_TIMEOUT_MS_MIN,
    ENV_SMART_FIELD_MAPPER_FETCH_TIMEOUT_MS_MAX,
  ),
  smartFieldMapperMaxFormHtmlChars: parseBoundedInt(
    Bun.env.SMART_FIELD_MAPPER_MAX_FORM_HTML_CHARS,
    ENV_SMART_FIELD_MAPPER_MAX_FORM_HTML_CHARS_DEFAULT,
    ENV_SMART_FIELD_MAPPER_MAX_FORM_HTML_CHARS_MIN,
    ENV_SMART_FIELD_MAPPER_MAX_FORM_HTML_CHARS_MAX,
  ),
  smartFieldMapperUserAgent: parseNonEmptyString(
    Bun.env.SMART_FIELD_MAPPER_USER_AGENT,
    ENV_SMART_FIELD_MAPPER_USER_AGENT_DEFAULT,
  ),
};
