import { Database } from "bun:sqlite";
import { SQLITE_BUSY_TIMEOUT_MS } from "@bao/shared";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { config } from "../config/env";
import { resolveDatabasePath } from "../config/paths";
import {
  applications,
  auth,
  automationRuns,
  chatHistory,
  coverLetters,
  gamification,
  interviewSessions,
  jobs,
  portfolioProjects,
  portfolios,
  resumes,
  savedJobs,
  settings,
  skillMappings,
  studios,
  userProfile,
} from "./schema/schema-modules";

const schema = {
  applications,
  auth,
  automationRuns,
  chatHistory,
  coverLetters,
  gamification,
  interviewSessions,
  jobs,
  portfolioProjects,
  portfolios,
  resumes,
  savedJobs,
  settings,
  skillMappings,
  studios,
  userProfile,
};

const dbPath = resolveDatabasePath(Bun.env.DB_PATH ?? config.dbPath);
const sqlite = new Database(dbPath);
sqlite.exec("PRAGMA journal_mode = WAL;");
sqlite.exec("PRAGMA foreign_keys = ON;");
sqlite.exec(`PRAGMA busy_timeout = ${SQLITE_BUSY_TIMEOUT_MS};`);

export const db = drizzle({ client: sqlite, schema });
export { sqlite };

/** SQL probe for health check endpoint. */
export const HEALTHCHECK_PROBE_SQL = "SELECT 1";
