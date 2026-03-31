import { afterEach, beforeAll, describe, expect, test } from "bun:test";
import { mkdirSync, rmSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { API_ERROR_SCREENSHOT_FILE_MISSING } from "@bao/shared/constants/api-errors";
import {
  API_ENDPOINT_PREFIX,
  buildAutomationScreenshotEndpoint,
} from "@bao/shared/constants/endpoints";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { AUTOMATION_SCREENSHOT_DIR } from "../config/paths";
import { db, sqlite } from "../db/client";
import { automationRuns } from "../db/schema/automation-runs";
import { CACHE_CONTROL_PRIVATE_NO_STORE } from "../utils/http-response";
import { automationScreenshotRoutes } from "./automation-screenshots.routes";

type ScreenshotApp = { handle: (request: Request) => Response | Promise<Response> };

const PNG_BYTES = new Uint8Array([137, 80, 78, 71]);

let app: ScreenshotApp;
const createdRunIds = new Set<string>();
const createdRunDirs = new Set<string>();

const createRunRecord = async (runId: string, screenshots: string[]): Promise<void> => {
  const now = new Date().toISOString();
  await db.insert(automationRuns).values({
    id: runId,
    type: "job_apply",
    status: "success",
    screenshots,
    progress: 100,
    timedOut: false,
    aborted: false,
    startedAt: now,
    completedAt: now,
    createdAt: now,
    updatedAt: now,
  });
  createdRunIds.add(runId);
};

const createRunDirectory = (runId: string): string => {
  const runDir = join(AUTOMATION_SCREENSHOT_DIR, runId);
  mkdirSync(runDir, { recursive: true });
  createdRunDirs.add(runDir);
  return runDir;
};

beforeAll(async () => {
  const initModule = await import("../db/init");
  const seedModule = await import("../db/seed");

  initModule.initializeDatabase(sqlite);
  seedModule.seedDatabase(db);

  app = new Elysia({ prefix: API_ENDPOINT_PREFIX }).use(automationScreenshotRoutes);
});

afterEach(async () => {
  await Promise.all(
    [...createdRunIds].map((runId) =>
      db.delete(automationRuns).where(eq(automationRuns.id, runId)),
    ),
  );
  createdRunIds.clear();

  for (const runDir of createdRunDirs) {
    rmSync(runDir, { recursive: true, force: true });
  }
  createdRunDirs.clear();
});

describe("automationScreenshotRoutes", () => {
  test("returns 404 when screenshot metadata points to a missing file", async () => {
    const runId = crypto.randomUUID();
    await createRunRecord(runId, ["step-01.png"]);

    const response = await app.handle(
      new Request(`http://localhost${buildAutomationScreenshotEndpoint(runId, 0)}`),
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: API_ERROR_SCREENSHOT_FILE_MISSING });
  });

  test("serves screenshot bytes with the expected content headers", async () => {
    const runId = crypto.randomUUID();
    await createRunRecord(runId, ["step-01.png"]);
    const runDir = createRunDirectory(runId);
    await writeFile(join(runDir, "step-01.png"), PNG_BYTES);

    const response = await app.handle(
      new Request(`http://localhost${buildAutomationScreenshotEndpoint(runId, 0)}`),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("cache-control")).toBe(CACHE_CONTROL_PRIVATE_NO_STORE);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(PNG_BYTES);
  });
});
