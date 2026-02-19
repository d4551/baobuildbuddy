const port = Number.parseInt(Bun.env.PORT || "3000", 10);
if (Number.isNaN(port) || port < 1 || port > 65535) {
  throw new Error(`Invalid PORT: ${Bun.env.PORT}`);
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
};
