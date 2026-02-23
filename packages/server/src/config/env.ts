import { DEFAULT_AUTOMATION_SETTINGS, RPA_STDIO_BUFFER_LIMIT } from "@bao/shared";

const port = Number.parseInt(Bun.env.PORT || "3000", 10);
if (Number.isNaN(port) || port < 1 || port > 65535) {
  throw new Error(`Invalid PORT: ${Bun.env.PORT}`);
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
    return [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3001",
    ];
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const host = Bun.env.HOST || "0.0.0.0";
const disableAuthEnv = Bun.env.BAO_DISABLE_AUTH;
/** Skip auth when explicitly disabled or binding only to localhost */
const isLocalhostOnly = host === "127.0.0.1" || host === "localhost" || host === "::1";

export const config = {
  port,
  host,
  dbPath: Bun.env.DB_PATH || "~/.bao/bao.db",
  logLevel: Bun.env.LOG_LEVEL || "info",
  corsOrigins: parseCorsOrigins(Bun.env.CORS_ORIGINS),
  /** When true, skip API key auth (local dev only) */
  disableAuth: disableAuthEnv === "true" || disableAuthEnv === "1" || isLocalhostOnly,
  automationScriptTimeoutMs: parseBoundedInt(
    Bun.env.AUTOMATION_SCRIPT_TIMEOUT_MS,
    DEFAULT_AUTOMATION_SETTINGS.defaultTimeout * 1_000,
    1_000,
    1_800_000,
  ),
  automationStdioBufferLimit: parseBoundedInt(
    Bun.env.AUTOMATION_STDIO_BUFFER_LIMIT,
    RPA_STDIO_BUFFER_LIMIT,
    10,
    2_000,
  ),
  smartFieldMapperRetries: parseBoundedInt(Bun.env.SMART_FIELD_MAPPER_RETRIES, 2, 1, 5),
  smartFieldMapperRetryDelayMs: parseBoundedInt(
    Bun.env.SMART_FIELD_MAPPER_RETRY_DELAY_MS,
    500,
    50,
    5_000,
  ),
  smartFieldMapperFetchTimeoutMs: parseBoundedInt(
    Bun.env.SMART_FIELD_MAPPER_FETCH_TIMEOUT_MS,
    10_000,
    500,
    120_000,
  ),
  smartFieldMapperMaxFormHtmlChars: parseBoundedInt(
    Bun.env.SMART_FIELD_MAPPER_MAX_FORM_HTML_CHARS,
    4_000,
    500,
    100_000,
  ),
  smartFieldMapperUserAgent: parseNonEmptyString(
    Bun.env.SMART_FIELD_MAPPER_USER_AGENT,
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  ),
};
