import { app } from "./app";
import { config } from "./config/env";
import { db, sqlite } from "./db/client";
import { initializeDatabase } from "./db/init";
import { seedDatabase } from "./db/seed";
import { JobAggregator } from "./services/jobs/job-aggregator";

// Initialize database
initializeDatabase(sqlite);

// Seed database with gaming studios (idempotent — only seeds if empty)
try {
  seedDatabase(db);
} catch (e) {
  console.error(`Seed failed: ${e instanceof Error ? e.message : e}`);
}

// Job refresh: run every 6 hours (Bun-native, no cron deps)
const JOB_REFRESH_MS = 6 * 60 * 60 * 1000;
setInterval(async () => {
  try {
    const aggregator = new JobAggregator();
    const result = await aggregator.refreshJobs();
    console.log(`[JobRefresh] ${result.new} new, ${result.updated} updated (${result.total} total)`);
  } catch (e) {
    console.error(`[JobRefresh] Failed: ${e instanceof Error ? e.message : e}`);
  }
}, JOB_REFRESH_MS);

// Start server
const server = app.listen(config.port);

console.log(`BaoBuildBuddy server running at http://${config.host}:${config.port}`);
console.log(`Health check: http://${config.host}:${config.port}/api/health`);

// Graceful shutdown
function gracefulShutdown(signal: string) {
  console.log(`\nReceived ${signal}, shutting down gracefully...`);
  server.stop();
  sqlite.close();
  console.log("Database closed. Goodbye.");
  process.exit(0);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
