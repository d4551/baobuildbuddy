import { join } from "node:path";
import {
  API_ERROR_INVALID_RUN_ID,
  API_ERROR_INVALID_SCREENSHOT_INDEX,
  API_ERROR_INVALID_SCREENSHOT_METADATA,
  API_ERROR_SCREENSHOT_FILE_MISSING,
  API_ERROR_SCREENSHOT_INDEX_OUT_OF_RANGE,
  API_ERROR_SCREENSHOT_NOT_FOUND,
} from "@bao/shared/constants/api-errors";
import { DECIMAL_RADIX } from "@bao/shared/constants/client-config";
import { API_ENDPOINTS, toApiScopedPath } from "@bao/shared/constants/endpoints";
import { HTTP_STATUS_BAD_REQUEST, HTTP_STATUS_NOT_FOUND } from "@bao/shared/constants/http";
import { RUN_ID_MIN_LENGTH, RUN_ID_SAFE_PATTERN_SOURCE } from "@bao/shared/constants/schema-limits";
import { settle } from "@bao/shared/utils/promise";
import { StandardSchemaV1 } from "baobox";
import { eq } from "drizzle-orm";
import Type from "baobox";
import { Elysia } from "elysia";
import { AUTOMATION_SCREENSHOT_DIR } from "../config/paths";
import { db } from "../db/client";
import { automationRuns } from "../db/schema/automation-runs";
import {
  automationScreenshotParams,
  type AutomationScreenshotParams,
  type RouteSetState,
} from "./automation-screenshot-route-contracts";
import {
  type BinaryPayload,
  CACHE_CONTROL_PRIVATE_NO_STORE,
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
  const parsedIndex = Number.parseInt(indexValue, DECIMAL_RADIX);
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

/**
 * Reads screenshot file contents using Bun-native file API.
 *
 * @param filePath - Absolute path to the screenshot file.
 * @returns File contents as ArrayBuffer, or null when the file does not exist.
 */
const readScreenshotPayload = async (filePath: string): Promise<BinaryPayload | null> => {
  const file = Bun.file(filePath);
  const exists = await file.exists();
  if (!exists) {
    return null;
  }

  const readResult = await settle(file.arrayBuffer());
  if (readResult.status === "fulfilled") {
    return new Uint8Array(readResult.value);
  }

  throw readResult.reason;
};

/**
 * Serves automation run screenshots from managed run directories.
 */
export const automationScreenshotRoutes = new Elysia({
  prefix: toApiScopedPath(API_ENDPOINTS.automationScreenshotsBase),
  tags: ["Automation"],
}).get(
  "/:runId/:index",
  async ({ params, set }: { params: AutomationScreenshotParams; set: RouteSetState }) => {
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
    params: automationScreenshotParams,
    response: {
      200: StandardSchemaV1(Type.Unknown()),
      400: StandardSchemaV1(
        Type.Object({
          error: Type.String(),
        }),
      ),
      404: StandardSchemaV1(
        Type.Object({
          error: Type.String(),
        }),
      ),
    },
  },
);
