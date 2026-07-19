import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

/**
 * Canonical Bun test preload for @bao/server.
 * Mirrored by repo-root bunfig.toml so `bun test` and `bun run test` share env.
 * Private-host opt-in is required for loopback job-apply fixtures (SSRF default-deny).
 */
process.env.NODE_ENV = "test";
process.env.BAO_DISABLE_AUTH = "true";
process.env.BAO_ENCRYPTION_KEY =
  process.env.BAO_ENCRYPTION_KEY ?? "bao-test-encryption-key-32bytes";
process.env.BAO_ENABLE_AUTOMATION_VERIFY = process.env.BAO_ENABLE_AUTOMATION_VERIFY ?? "true";
process.env.BAO_ALLOW_AUTOMATION_PRIVATE_HOSTS =
  process.env.BAO_ALLOW_AUTOMATION_PRIVATE_HOSTS ?? "true";
Bun.env.BAO_DISABLE_AUTH = "true";
Bun.env.BAO_ENCRYPTION_KEY = process.env.BAO_ENCRYPTION_KEY;
Bun.env.BAO_ENABLE_AUTOMATION_VERIFY = process.env.BAO_ENABLE_AUTOMATION_VERIFY;
Bun.env.BAO_ALLOW_AUTOMATION_PRIVATE_HOSTS = process.env.BAO_ALLOW_AUTOMATION_PRIVATE_HOSTS;
const testDbPath = join(tmpdir(), "bao-tests", `${crypto.randomUUID()}.db`);
mkdirSync(dirname(testDbPath), { recursive: true });
process.env.DB_PATH = testDbPath;
Bun.env.DB_PATH = testDbPath;
