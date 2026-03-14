import { JOB_AGGREGATOR_CACHE_EXPIRY_MS, settle } from "@bao/shared";
import { app } from "./app";
import { config } from "./config/env";
import { db, sqlite } from "./db/client";
import { initializeDatabase } from "./db/init";
import { seedDatabase } from "./db/seed";
import { JobAggregator } from "./services/jobs/job-aggregator";
import { createServerLogger } from "./utils/logger";

const logger = createServerLogger("server-lifecycle");

const runBackgroundTask = (task: Promise<unknown>, onError?: (error: unknown) => void): void => {
  task.then(
    () => undefined,
    (error) => {
      onError?.(error);
    },
  );
};

// Initialize database
initializeDatabase(sqlite);

// Seed database with gaming studios (idempotent — only seeds if empty)
runBackgroundTask(
  (async () => {
    const seedResult = await settle(Promise.resolve().then(() => seedDatabase(db)));
    if (seedResult.status === "rejected") {
      logger.error(
        "Seed failed",
        seedResult.reason instanceof Error ? seedResult.reason.message : seedResult.reason,
      );
    }
  })(),
);

// Job refresh: run every 6 hours (Bun-native, no cron deps)
setInterval(() => {
  const aggregator = new JobAggregator();
  runBackgroundTask(
    (async () => {
      const refreshResult = await settle(aggregator.refreshJobs());
      if (refreshResult.status === "rejected") {
        logger.error(
          "JobRefresh failed",
          refreshResult.reason instanceof Error
            ? refreshResult.reason.message
            : refreshResult.reason,
        );
        return;
      }

      logger.info(
        `JobRefresh ${refreshResult.value.new} new, ${refreshResult.value.updated} updated (${refreshResult.value.total} total)`,
      );
    })(),
  );
}, JOB_AGGREGATOR_CACHE_EXPIRY_MS);

// Start server
const server = app.listen(config.port);

logger.info(`BaoBuildBuddy server running at http://${config.host}:${config.port}`);
logger.info(`Health check: http://${config.host}:${config.port}/api/health`);

// Graceful shutdown
async function gracefulShutdown(signal: string): Promise<void> {
  logger.warn(`Received ${signal}, shutting down gracefully...`);
  await server.stop();
  sqlite.close();
  logger.info("Database closed. Goodbye.");
  process.exit(0);
}

process.on("SIGTERM", () => {
  runBackgroundTask(gracefulShutdown("SIGTERM"), (error) => {
    logger.error("Graceful shutdown failed", error instanceof Error ? error.message : error);
  });
});
process.on("SIGINT", () => {
  runBackgroundTask(gracefulShutdown("SIGINT"), (error) => {
    logger.error("Graceful shutdown failed", error instanceof Error ? error.message : error);
  });
});
