import type { Static } from "typebox";
import { RUN_ID_MIN_LENGTH, RUN_ID_SAFE_PATTERN_SOURCE } from "@bao/shared/constants/schema-limits";
import { t } from "elysia";

export const automationScreenshotParamsSchema = t.Object(
  {
    runId: t.String({ minLength: RUN_ID_MIN_LENGTH, pattern: RUN_ID_SAFE_PATTERN_SOURCE }),
    index: t.String({ minLength: 1, pattern: "^(0|[1-9][0-9]*)$" }),
  },
  { required: ["runId", "index"] },
);

export type AutomationScreenshotParams = Static<typeof automationScreenshotParamsSchema>;

export const automationScreenshotParams = automationScreenshotParamsSchema;
