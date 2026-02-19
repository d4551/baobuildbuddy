import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

process.env.NODE_ENV = "test";
process.env.BAO_DISABLE_AUTH = "true";
const testDbPath = join(tmpdir(), "bao-tests", `${randomUUID()}.db`);
mkdirSync(dirname(testDbPath), { recursive: true });
process.env.DB_PATH = testDbPath;
