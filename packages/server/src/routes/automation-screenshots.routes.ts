import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { AUTOMATION_SCREENSHOT_DIR } from "../config/paths";
import { db } from "../db/client";
import { automationRuns } from "../db/schema/automation-runs";

const HTTP_STATUS_NOT_FOUND = 404;
const RUN_ID_SAFE_PATTERN = /^[0-9a-fA-F-]+$/;
const FILE_NAME_SAFE_PATTERN = /^[a-zA-Z0-9._-]+$/;
const ALLOWED_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"]);
const HTTP_STATUS_BAD_REQUEST = 400;
const RUN_ID_MIN_LENGTH = 8;
const CONTENT_TYPE_BY_EXTENSION: Readonly<Record<string, string>> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".bmp": "image/bmp",
};

const isInvalidScreenshotIndex = (value: string): boolean =>
  value.length === 0 || value.includes(".") || value[0] === "-";

const isInvalidRunId = (runId: string): boolean =>
  runId.length < RUN_ID_MIN_LENGTH || !RUN_ID_SAFE_PATTERN.test(runId);

const isSafeScreenshotFileName = (fileName: unknown): fileName is string =>
  typeof fileName === "string" &&
  FILE_NAME_SAFE_PATTERN.test(fileName) &&
  ALLOWED_EXTENSIONS.has(extname(fileName).toLowerCase());

const resolveScreenshotIndex = (indexValue: string, screenshotCount: number): number | null => {
  const parsedIndex = Number.parseInt(indexValue, 10);
  if (Number.isNaN(parsedIndex) || parsedIndex < 0 || parsedIndex >= screenshotCount) {
    return null;
  }
  return parsedIndex;
};

const readRunScreenshots = async (runId: string): Promise<{ id: string; screenshots: string[] } | null> => {
  const runRows = await db.select().from(automationRuns).where(eq(automationRuns.id, runId)).limit(1);
  const run = runRows[0];
  if (!(run && Array.isArray(run.screenshots))) {
    return null;
  }
  return { id: run.id, screenshots: run.screenshots };
};

const createScreenshotResponse = (contents: Uint8Array, extension: string): Response =>
  new Response(Buffer.from(contents), {
    headers: {
      "content-type": CONTENT_TYPE_BY_EXTENSION[extension] || "application/octet-stream",
      "cache-control": "private, no-store, no-cache",
    },
  });

/**
 * Serves automation run screenshots from managed run directories.
 */
export const automationScreenshotRoutes = new Elysia({
  prefix: "/automation/screenshots",
}).get(
  "/:runId/:index",
  async ({ params, set }) => {
    if (typeof params.index !== "string" || isInvalidScreenshotIndex(params.index)) {
      set.status = HTTP_STATUS_BAD_REQUEST;
      return { error: "Invalid screenshot index format" };
    }

    if (isInvalidRunId(params.runId)) {
      set.status = HTTP_STATUS_BAD_REQUEST;
      return { error: "Invalid run ID format" };
    }

    const run = await readRunScreenshots(params.runId);
    if (!run) {
      set.status = HTTP_STATUS_NOT_FOUND;
      return { error: "Screenshot not found" };
    }

    const idx = resolveScreenshotIndex(params.index, run.screenshots.length);
    if (idx === null) {
      set.status = HTTP_STATUS_NOT_FOUND;
      return { error: "Screenshot index out of range" };
    }

    const fileName = run.screenshots[idx];
    if (!isSafeScreenshotFileName(fileName)) {
      set.status = HTTP_STATUS_NOT_FOUND;
      return { error: "Invalid screenshot file metadata" };
    }

    const filePath = resolve(AUTOMATION_SCREENSHOT_DIR, run.id, fileName);
    if (!existsSync(filePath)) {
      set.status = HTTP_STATUS_NOT_FOUND;
      return { error: "Screenshot file missing from disk" };
    }

    const extension = extname(fileName).toLowerCase();
    const contents = await readFile(filePath);
    return createScreenshotResponse(contents, extension);
  },
  {
    params: t.Object({
      runId: t.String({ minLength: RUN_ID_MIN_LENGTH, pattern: RUN_ID_SAFE_PATTERN.source }),
      index: t.String({ minLength: 1, pattern: "^(0|[1-9][0-9]*)$" }),
    }),
    response: {
      200: t.Unknown(),
      400: t.Object({
        error: t.String(),
      }),
      404: t.Object({
        error: t.String(),
      }),
    },
  },
);
