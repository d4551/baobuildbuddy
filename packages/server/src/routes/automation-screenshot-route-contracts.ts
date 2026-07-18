import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
} from "@bao/shared/constants/http";
import { RUN_ID_MIN_LENGTH, RUN_ID_SAFE_PATTERN_SOURCE } from "@bao/shared/constants/schema-limits";
import { t } from "elysia";
import type { Static } from "typebox";
import { simpleErrorResponseSchema } from "./route-error-envelope";

export const automationScreenshotParamsSchema = t.Object(
  {
    runId: t.String({ minLength: RUN_ID_MIN_LENGTH, pattern: RUN_ID_SAFE_PATTERN_SOURCE }),
    index: t.String({ minLength: 1, pattern: "^(0|[1-9][0-9]*)$" }),
  },
  { required: ["runId", "index"] },
);

export type AutomationScreenshotParams = Static<typeof automationScreenshotParamsSchema>;

export const automationScreenshotParams = automationScreenshotParamsSchema;

export const automationScreenshotResponses = {
  [HTTP_STATUS_OK]: t.Unknown(),
  [HTTP_STATUS_BAD_REQUEST]: simpleErrorResponseSchema,
  [HTTP_STATUS_NOT_FOUND]: simpleErrorResponseSchema,
} as const;
