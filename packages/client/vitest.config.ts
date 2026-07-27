import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineVitestConfig } from "@nuxt/test-utils/config";

const CLIENT_ROOT = dirname(fileURLToPath(import.meta.url));

/**
 * Booting the Nuxt test environment (specs opting in via `@vitest-environment nuxt`)
 * routinely exceeds vitest's 10s default on a loaded machine. This budgets the setup
 * hook only — no assertion or timeout on the tests themselves is relaxed.
 */
const NUXT_ENV_BOOT_TIMEOUT_MS = 120_000;

export default defineVitestConfig({
  resolve: {
    alias: {
      "~": resolve(CLIENT_ROOT),
      "~~": resolve(CLIENT_ROOT),
    },
  },
  test: {
    environment: "happy-dom",
    hookTimeout: NUXT_ENV_BOOT_TIMEOUT_MS,
  },
});
