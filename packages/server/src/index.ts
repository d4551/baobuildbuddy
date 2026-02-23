import { app } from "./app";
import { config } from "./config/env";
import { db, sqlite } from "./db/client";
import { initializeDatabase } from "./db/init";
import { seedDatabase } from "./db/seed";
import { JobAggregator } from "./services/jobs/job-aggregator";
import { createServerLogger } from "./utils/logger";

const logger = createServerLogger("server-lifecycle");
const settle = async <T>(operation: Promise<T>): Promise<PromiseSettledResult<T>> => {
  const [result] = await Promise.allSettled([operation]);
  return result;
};

// Initialize database
initializeDatabase(sqlite);

// Seed database with gaming studios (idempotent — only seeds if empty)
void (async () => {
  const seedResult = await settle(seedDatabase(db));
  if (seedResult.status === "rejected") {
    logger.error(
      "Seed failed",
      seedResult.reason instanceof Error ? seedResult.reason.message : seedResult.reason,
    );
  }
})();

// Job refresh: run every 6 hours (Bun-native, no cron deps)
const JOB_REFRESH_MS = 6 * 60 * 60 * 1000;
setInterval(() => {
  const aggregator = new JobAggregator();
  void (async () => {
    const refreshResult = await settle(aggregator.refreshJobs());
    if (refreshResult.status === "rejected") {
      logger.error(
        "JobRefresh failed",
        refreshResult.reason instanceof Error ? refreshResult.reason.message : refreshResult.reason,
      );
      return;
    }

    logger.info(
      `JobRefresh ${refreshResult.value.new} new, ${refreshResult.value.updated} updated (${refreshResult.value.total} total)`,
    );
  })();
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
