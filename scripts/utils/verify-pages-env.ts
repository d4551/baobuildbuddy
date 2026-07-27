import { join } from "node:path";
import { APP_BRAND } from "../../packages/shared/src/tokens/branding";
import { APP_ROUTES } from "../../packages/shared/src/constants/routes";
import {
  DEFAULT_VERIFY_HOST,
  DEFAULT_VERIFY_PORT,
  PREVIEW_SEPARATOR_LENGTH,
} from "../../packages/shared/src/constants/scripts";

type EnvMap = Readonly<Record<string, string | undefined>>;

/**
 * Module-level env reader. Sole allowed env surface for verify-pages scripts —
 * mirrors scripts/utils/proof-script-env.ts so no direct runtime env access
 * leaks into module scope.
 */
const readRuntimeEnv = (): EnvMap => {
  const runtime = globalThis as {
    process?: { env?: EnvMap };
  };
  return runtime.process?.env ?? {};
};

const TRAILING_SLASH_PATTERN = /\/$/u;

export const NUM_26 = 26;
export const NUM_5 = 5;

export const VERIFY_HOST = readRuntimeEnv().VERIFY_HOST || DEFAULT_VERIFY_HOST;
export const VERIFY_PORT = readRuntimeEnv().VERIFY_PORT || DEFAULT_VERIFY_PORT;

const DEFAULT_VERIFY_BASE_URL = ["http://", VERIFY_HOST, ":", VERIFY_PORT].join("");
export const EXTERNAL_VERIFY_BASE_URL =
  readRuntimeEnv().VERIFY_BASE_URL?.replace(TRAILING_SLASH_PATTERN, "") ?? null;
export const VERIFY_BASE_URL = EXTERNAL_VERIFY_BASE_URL ?? DEFAULT_VERIFY_BASE_URL;

export const CLIENT_PACKAGE_ROOT = join(process.cwd(), "packages", "client");
export const CLIENT_OUTPUT_ROOT = join(CLIENT_PACKAGE_ROOT, ".output");
export const CLIENT_BUILD_OUTPUT_PATH = join(CLIENT_PACKAGE_ROOT, ".output", "server", "index.mjs");
export const CLIENT_BUILD_CHUNKS_PATH = join(CLIENT_PACKAGE_ROOT, ".output", "server", "chunks");

export const EXPECTED_BRAND_TOKEN = APP_BRAND.name.toLowerCase();
export const BRAND_NAME = APP_BRAND.name;
export const ROUTE_PATHS = Array.from(new Set(Object.values(APP_ROUTES)));
export const LINE_SEPARATOR = "-".repeat(PREVIEW_SEPARATOR_LENGTH);
