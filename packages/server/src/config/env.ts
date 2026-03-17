import {
  API_ERROR_INVALID_PORT,
  DECIMAL_RADIX,
  DEFAULT_CLIENT_DEV_PORT,
  DEFAULT_CORS_ORIGINS,
  DEFAULT_DB_PATH_TILDE,
  DEFAULT_HOST,
  DEFAULT_LOG_LEVEL,
  DEFAULT_SERVER_PORT,
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
  LOOPBACK_HOST,
  LOOPBACK_HOST_IPV4,
  MAX_PORT,
  MIN_PORT,
} from "@bao/shared";

const configuredServerPort = [Bun.env.SERVER_PORT, Bun.env.PORT].find(
  (value) => value?.trim().length,
);
const portSource = configuredServerPort ?? `${DEFAULT_SERVER_PORT}`;
const port = Number.parseInt(portSource, DECIMAL_RADIX);
if (Number.isNaN(port) || port < MIN_PORT || port > MAX_PORT) {
  throw new Error(`${API_ERROR_INVALID_PORT}: ${portSource}`);
}

function parseBoundedInt(
  value: string | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  const parsed = Number.parseInt(value ?? "", DECIMAL_RADIX);
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

function parseOptionalNonEmptyString(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseBooleanFlag(primary: string | undefined, secondary?: string): boolean {
  const value = primary ?? secondary;
  return value === "true" || value === "1";
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

const resolveCorsOrigins = (serverPort: number, clientPort: number): string[] => {
  const parsedCorsOrigins = parseCorsOrigins(Bun.env.CORS_ORIGINS);
  if (process.env.NODE_ENV === "production") {
    return parsedCorsOrigins;
  }

  const uniqueOrigins = new Set(parsedCorsOrigins);
  for (const localPort of [serverPort, clientPort]) {
    const localPortValue = `${localPort}`;
    uniqueOrigins.add(`http://${LOOPBACK_HOST}:${localPortValue}`);
    uniqueOrigins.add(`http://${LOOPBACK_HOST_IPV4}:${localPortValue}`);
  }
  return [...uniqueOrigins];
};

const resolveClientPort = (): number => {
  const configuredClientPort = [Bun.env.CLIENT_PORT, Bun.env.NUXT_CLIENT_PORT].find(
    (value) => value?.trim().length,
  );
  return parseBoundedInt(
    configuredClientPort,
    DEFAULT_CLIENT_DEV_PORT,
    MIN_PORT,
    MAX_PORT,
  );
};

const resolveAuthConfig = () => {
  const disableAuthEnv = Bun.env.BAO_DISABLE_AUTH;
  return {
    disableAuth: disableAuthEnv === "true" || disableAuthEnv === "1",
    authSetupToken: parseOptionalNonEmptyString(Bun.env.BAO_AUTH_SETUP_TOKEN),
  };
};

const resolveEnableAutomationVerification = (): boolean =>
  parseBooleanFlag(
    Bun.env.BAO_ENABLE_AUTOMATION_VERIFY,
    process.env.BAO_ENABLE_AUTOMATION_VERIFY,
  );

const resolveAllowAutomationPrivateHosts = (): boolean =>
  parseBooleanFlag(
    Bun.env.BAO_ALLOW_AUTOMATION_PRIVATE_HOSTS,
    process.env.BAO_ALLOW_AUTOMATION_PRIVATE_HOSTS,
  );

const resolveAutomationRuntimeConfig = () => ({
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
});

const resolveSmartFieldMapperConfig = () => ({
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
});

/**
 * Resolves the current server runtime configuration from environment variables.
 */
export function readConfig() {
  const host = Bun.env.HOST || DEFAULT_HOST;
  const clientPort = resolveClientPort();

  return {
    port,
    host,
    dbPath: Bun.env.DB_PATH || DEFAULT_DB_PATH_TILDE,
    logLevel: Bun.env.LOG_LEVEL || DEFAULT_LOG_LEVEL,
    corsOrigins: resolveCorsOrigins(port, clientPort),
    ...resolveAuthConfig(),
    get enableAutomationVerification(): boolean {
      return resolveEnableAutomationVerification();
    },
    get allowAutomationPrivateHosts(): boolean {
      return resolveAllowAutomationPrivateHosts();
    },
    ...resolveAutomationRuntimeConfig(),
    ...resolveSmartFieldMapperConfig(),
  };
}

/**
 * Stable server runtime configuration for the current process.
 */
export type ServerConfig = ReturnType<typeof readConfig>;

/**
 * Cached runtime configuration for the active process.
 */
export const config: ServerConfig = readConfig();
