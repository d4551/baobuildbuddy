import { Database } from "bun:sqlite";
import { SQLITE_BUSY_TIMEOUT_MS } from "@bao/shared/constants/database";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { config } from "../config/env";
import { resolveDatabasePath } from "../config/paths";
import {
  applications,
  auditLog,
  auth,
  automationRuns,
  chatHistory,
  coverLetters,
  gamification,
  interviewSessions,
  jobs,
  jobTaxonomyKeywords,
  portfolioProjects,
  portfolios,
  resumes,
  savedJobs,
  settings,
  skillMappings,
  studioClassificationRules,
  studios,
  userProfile,
  userRole,
} from "./schema/schema-modules";

const schema = {
  applications,
  auditLog,
  auth,
  automationRuns,
  chatHistory,
  coverLetters,
  gamification,
  interviewSessions,
  jobTaxonomyKeywords,
  jobs,
  portfolioProjects,
  portfolios,
  resumes,
  savedJobs,
  settings,
  skillMappings,
  studioClassificationRules,
  studios,
  userProfile,
  userRole,
};

const dbPath = resolveDatabasePath(config.dbPath);
const sqlite = new Database(dbPath);
sqlite.exec(`PRAGMA busy_timeout = ${SQLITE_BUSY_TIMEOUT_MS};`);
sqlite.exec("PRAGMA journal_mode = WAL;");
sqlite.exec("PRAGMA foreign_keys = ON;");

export const db = drizzle({ client: sqlite, schema });
export { sqlite };

/** SQL probe for health check endpoint. */
export const HEALTHCHECK_PROBE_SQL = "SELECT 1";
