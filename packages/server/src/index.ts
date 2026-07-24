import { API_ENDPOINTS, OPENAI_V1_ENDPOINT_PREFIX } from "@bao/shared/constants/endpoints";
import { JOB_AGGREGATOR_CACHE_EXPIRY_MS } from "@bao/shared/constants/jobs";
import { settle } from "@bao/shared/utils/promise";
import { toErrorMessage } from "@bao/shared/utils/error-helpers";
import { Elysia } from "elysia";
import { app } from "./app";
import { config } from "./config/env";
import { db, sqlite } from "./db/client";
import { initializeDatabase } from "./db/init";
import { seedDatabase } from "./db/seed";
import { openaiV1Routes } from "./routes/openai-v1.routes";
import { JobAggregator } from "./services/jobs/job-aggregator";
import { createServerLogger } from "./utils/logger";

const logger = createServerLogger("server-lifecycle");

process.on("uncaughtException", (error) => {
  logger.error("uncaughtException", toErrorMessage(error));
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error("unhandledRejection", reason instanceof Error ? reason.message : String(reason));
  process.exit(1);
});

const runBackgroundTask = (
  task: Promise<void>,
  onError?: (error: Error | string) => void,
): void => {
  task.then(
    () => undefined,
    (error) => {
      onError?.(error instanceof Error ? error.message : String(error));
    },
  );
};

initializeDatabase(sqlite);

runBackgroundTask(
  (async () => {
    const seedResult = await settle(Promise.resolve().then(() => seedDatabase(db)));
    if (seedResult.status === "rejected") {
      logger.error(
        "Seed failed",
        seedResult.reason instanceof Error ? seedResult.reason.message : String(seedResult.reason),
      );
    }
  })(),
);

// Job refresh: initial run on startup, then every 6 hours (Bun-native, no cron deps)
const runJobRefresh = (): void => {
  const aggregator = new JobAggregator();
  runBackgroundTask(
    (async () => {
      const refreshResult = await settle(aggregator.refreshJobs());
      if (refreshResult.status === "rejected") {
        logger.error(
          "JobRefresh failed",
          refreshResult.reason instanceof Error
            ? refreshResult.reason.message
            : String(refreshResult.reason),
        );
        return;
      }

      logger.info(
        `JobRefresh ${refreshResult.value.new} new, ${refreshResult.value.updated} updated (${refreshResult.value.total} total)`,
      );
    })(),
  );
};
runJobRefresh();
setInterval(runJobRefresh, JOB_AGGREGATOR_CACHE_EXPIRY_MS);

const serverApp = new Elysia().use(openaiV1Routes).use(app);
const server = serverApp.listen(config.port);

logger.info(`BaoBuildBuddy server running at http://${config.host}:${config.port}`);
logger.info(`Health check: http://${config.host}:${config.port}${API_ENDPOINTS.health}`);
logger.info(
  `OpenAI Chat Completions API: http://${config.host}:${config.port}${OPENAI_V1_ENDPOINT_PREFIX}`,
);

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
