import { existsSync } from "node:fs";
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

/**
 * Serves automation run screenshots from managed run directories.
 */
export const automationScreenshotRoutes = new Elysia({
  prefix: "/automation/screenshots",
}).get(
  "/:runId/:index",
  async ({ params, set }) => {
    if (
      typeof params.index !== "string" ||
      params.index.length === 0 ||
      params.index.includes(".") ||
      params.index[0] === "-"
    ) {
      set.status = HTTP_STATUS_BAD_REQUEST;
      return { error: "Invalid screenshot index format" };
    }

    if (params.runId.length < RUN_ID_MIN_LENGTH || !RUN_ID_SAFE_PATTERN.test(params.runId)) {
      set.status = HTTP_STATUS_BAD_REQUEST;
      return { error: "Invalid run ID format" };
    }

    const run = await db
      .select()
      .from(automationRuns)
      .where(eq(automationRuns.id, params.runId))
      .limit(1);

    if (!run.length || !run[0].screenshots) {
      set.status = HTTP_STATUS_NOT_FOUND;
      return { error: "Screenshot not found" };
    }

    const screenshots = run[0].screenshots;
    const idx = Number.parseInt(params.index, 10);
    if (Number.isNaN(idx) || idx < 0 || idx >= screenshots.length) {
      set.status = HTTP_STATUS_NOT_FOUND;
      return { error: "Screenshot index out of range" };
    }

    const fileName = screenshots[idx];
    if (
      typeof fileName !== "string" ||
      !FILE_NAME_SAFE_PATTERN.test(fileName) ||
      !ALLOWED_EXTENSIONS.has(extname(fileName).toLowerCase())
    ) {
      set.status = HTTP_STATUS_NOT_FOUND;
      return { error: "Invalid screenshot file metadata" };
    }

    const filePath = resolve(AUTOMATION_SCREENSHOT_DIR, run[0].id, fileName);
    if (!existsSync(filePath)) {
      set.status = HTTP_STATUS_NOT_FOUND;
      return { error: "Screenshot file missing from disk" };
    }

    const file = Bun.file(filePath);
    if (!(await file.exists())) {
      set.status = HTTP_STATUS_NOT_FOUND;
      return { error: "Screenshot file missing from disk after resolve" };
    }

    const extension = extname(fileName).toLowerCase();
    return new Response(file, {
      headers: {
        "content-type": CONTENT_TYPE_BY_EXTENSION[extension] || "application/octet-stream",
        "cache-control": "private, no-store, no-cache",
      },
    });
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
