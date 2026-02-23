import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const CLIENT_ROOT = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "~": resolve(CLIENT_ROOT),
      "~~": resolve(CLIENT_ROOT),
    },
  },
  test: {
    environment: "happy-dom",
  },
});
