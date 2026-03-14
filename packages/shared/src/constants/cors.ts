import { DEFAULT_CLIENT_DEV_PORT, DEFAULT_SERVER_PORT } from "./ports";

/**
 * CORS configuration constants. Single source of truth for default allowed origins.
 */

/** Default CORS origins when CORS_ORIGINS env is not set (local dev). */
export const DEFAULT_CORS_ORIGINS = [
  `http://localhost:${DEFAULT_SERVER_PORT}`,
  `http://127.0.0.1:${DEFAULT_SERVER_PORT}`,
  `http://localhost:${DEFAULT_CLIENT_DEV_PORT}`,
  `http://127.0.0.1:${DEFAULT_CLIENT_DEV_PORT}`,
] as const;
