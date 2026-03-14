import {
  API_ERROR_INVALID_RUN_ID,
  API_ERROR_INVALID_SCREENSHOT_INDEX,
  API_ERROR_SCREENSHOT_FILE_MISSING,
  API_ERROR_SCREENSHOT_INDEX_OUT_OF_RANGE,
  API_ERROR_INVALID_SCREENSHOT_METADATA,
  API_ERROR_SCREENSHOT_NOT_FOUND,
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_NOT_FOUND,
  RUN_ID_MIN_LENGTH,
  RUN_ID_SAFE_PATTERN_SOURCE,
  settle,
} from "@bao/shared";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { AUTOMATION_SCREENSHOT_DIR } from "../config/paths";
import { db } from "../db/client";
import { automationRuns } from "../db/schema/automation-runs";
import {
  CACHE_CONTROL_PRIVATE_NO_STORE,
  type BinaryPayload,
  createBinaryResponse,
  MIME_TYPE_OCTET_STREAM,
} from "../utils/http-response";

const RUN_ID_SAFE_PATTERN = new RegExp(RUN_ID_SAFE_PATTERN_SOURCE);
const FILE_NAME_SAFE_PATTERN = /^[a-zA-Z0-9._-]+$/;
const ALLOWED_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"]);
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

const getScreenshotExtension = (fileName: string): string =>
  fileName.slice(Math.max(0, fileName.lastIndexOf(".") + 1)).toLowerCase();

const isSafeScreenshotFileName = (fileName: unknown): fileName is string =>
  typeof fileName === "string" &&
  FILE_NAME_SAFE_PATTERN.test(fileName) &&
  ALLOWED_EXTENSIONS.has(`.${getScreenshotExtension(fileName)}`);

const resolveScreenshotIndex = (indexValue: string, screenshotCount: number): number | null => {
  const parsedIndex = Number.parseInt(indexValue, 10);
  if (Number.isNaN(parsedIndex) || parsedIndex < 0 || parsedIndex >= screenshotCount) {
    return null;
  }
  return parsedIndex;
};

const readRunScreenshots = async (
  runId: string,
): Promise<{ id: string; screenshots: string[] } | null> => {
  const runRows = await db
    .select()
    .from(automationRuns)
    .where(eq(automationRuns.id, runId))
    .limit(1);
  const run = runRows[0];
  if (!(run && Array.isArray(run.screenshots))) {
    return null;
  }
  return { id: run.id, screenshots: run.screenshots };
};

const createScreenshotResponse = (contents: BinaryPayload, extension: string): Response =>
  createBinaryResponse(contents, {
    contentType: CONTENT_TYPE_BY_EXTENSION[extension] || MIME_TYPE_OCTET_STREAM,
    cacheControl: CACHE_CONTROL_PRIVATE_NO_STORE,
  });

const isMissingFileError = (error: unknown): boolean =>
  Boolean(error && typeof error === "object" && "code" in error && error.code === "ENOENT");

const readScreenshotPayload = async (filePath: string): Promise<BinaryPayload | null> => {
  const readResult = await settle(readFile(filePath));
  if (readResult.status === "fulfilled") {
    return readResult.value;
  }

  if (isMissingFileError(readResult.reason)) {
    return null;
  }

  throw readResult.reason;
};

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
      return { error: API_ERROR_INVALID_SCREENSHOT_INDEX };
    }

    if (isInvalidRunId(params.runId)) {
      set.status = HTTP_STATUS_BAD_REQUEST;
      return { error: API_ERROR_INVALID_RUN_ID };
    }

    const run = await readRunScreenshots(params.runId);
    if (!run) {
      set.status = HTTP_STATUS_NOT_FOUND;
      return { error: API_ERROR_SCREENSHOT_NOT_FOUND };
    }

    const idx = resolveScreenshotIndex(params.index, run.screenshots.length);
    if (idx === null) {
      set.status = HTTP_STATUS_NOT_FOUND;
      return { error: API_ERROR_SCREENSHOT_INDEX_OUT_OF_RANGE };
    }

    const fileName = run.screenshots[idx];
    if (!isSafeScreenshotFileName(fileName)) {
      set.status = HTTP_STATUS_NOT_FOUND;
      return { error: API_ERROR_INVALID_SCREENSHOT_METADATA };
    }

    const filePath = join(AUTOMATION_SCREENSHOT_DIR, run.id, fileName);
    const contents = await readScreenshotPayload(filePath);
    if (!contents) {
      set.status = HTTP_STATUS_NOT_FOUND;
      return { error: API_ERROR_SCREENSHOT_FILE_MISSING };
    }

    const extension = `.${getScreenshotExtension(fileName)}`;
    return createScreenshotResponse(contents, extension);
  },
  {
    params: t.Object({
      runId: t.String({ minLength: RUN_ID_MIN_LENGTH, pattern: RUN_ID_SAFE_PATTERN_SOURCE }),
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
