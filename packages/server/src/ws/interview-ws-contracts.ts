import type { Static } from "typebox";
import {
  SCHEMA_MAX_LENGTH_ID,
  SCHEMA_MAX_LENGTH_LABEL,
  SCHEMA_MAX_LENGTH_MESSAGE,
} from "@bao/shared/constants/schema-limits";
import { t } from "elysia";
import { sessionConfigSchema } from "../routes/interview-route-contracts";

export const interviewWebSocketBodySchema = t.Object({
  type: t.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL }),
  sessionId: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
  content: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_MESSAGE })),
  studioId: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
  config: t.Optional(sessionConfigSchema),
});

export type InterviewWebSocketBody = Static<typeof interviewWebSocketBodySchema>;
