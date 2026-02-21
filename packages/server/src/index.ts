import { app } from "./app";
import { config } from "./config/env";
import { db, sqlite } from "./db/client";
import { initializeDatabase } from "./db/init";
import { seedDatabase } from "./db/seed";
import { JobAggregator } from "./services/jobs/job-aggregator";
import { createServerLogger } from "./utils/logger";

const logger = createServerLogger("server-lifecycle");

// Initialize database
initializeDatabase(sqlite);

// Seed database with gaming studios (idempotent — only seeds if empty)
void seedDatabase(db).catch((error) => {
  logger.error("Seed failed", error instanceof Error ? error.message : error);
});

// Job refresh: run every 6 hours (Bun-native, no cron deps)
const JOB_REFRESH_MS = 6 * 60 * 60 * 1000;
setInterval(() => {
  const aggregator = new JobAggregator();
  void aggregator
    .refreshJobs()
    .then((result) => {
      logger.info(
        `JobRefresh ${result.new} new, ${result.updated} updated (${result.total} total)`,
      );
    })
    .catch((error) => {
      logger.error("JobRefresh failed", error instanceof Error ? error.message : error);
    });
}, JOB_REFRESH_MS);

// Start server
const server = app.listen(config.port);

logger.info(`BaoBuildBuddy server running at http://${config.host}:${config.port}`);
logger.info(`Health check: http://${config.host}:${config.port}/api/health`);

// Graceful shutdown
function gracefulShutdown(signal: string) {
  logger.warn(`Received ${signal}, shutting down gracefully...`);
  server.stop();
  sqlite.close();
  logger.info("Database closed. Goodbye.");
  process.exit(0);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
