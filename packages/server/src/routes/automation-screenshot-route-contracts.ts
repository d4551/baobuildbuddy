import { RUN_ID_MIN_LENGTH, RUN_ID_SAFE_PATTERN_SOURCE } from "@bao/shared/constants/schema-limits";
import Type, { StandardSchemaV1, type StaticParse } from "baobox";

export const automationScreenshotParamsSchema = Type.Object(
  {
    runId: Type.String({ minLength: RUN_ID_MIN_LENGTH, pattern: RUN_ID_SAFE_PATTERN_SOURCE }),
    index: Type.String({ minLength: 1, pattern: "^(0|[1-9][0-9]*)$" }),
  },
  { required: ["runId", "index"] },
);

export type AutomationScreenshotParams = StaticParse<typeof automationScreenshotParamsSchema>;

export const automationScreenshotParams = StandardSchemaV1(automationScreenshotParamsSchema);
