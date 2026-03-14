import { mkdirSync } from "fs";
import { tmpdir } from "os";
import { dirname, join } from "path";

process.env.NODE_ENV = "test";
process.env.BAO_DISABLE_AUTH = "true";
const testDbPath = join(tmpdir(), "bao-tests", `${crypto.randomUUID()}.db`);
mkdirSync(dirname(testDbPath), { recursive: true });
process.env.DB_PATH = testDbPath;
