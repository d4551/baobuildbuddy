import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
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
