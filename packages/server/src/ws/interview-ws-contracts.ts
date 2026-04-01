import {
  SCHEMA_MAX_LENGTH_ID,
  SCHEMA_MAX_LENGTH_LABEL,
  SCHEMA_MAX_LENGTH_MESSAGE,
} from "@bao/shared/constants/schema-limits";
import Type, { type StaticParse } from "baobox";
import { sessionConfigSchema } from "../routes/interview-route-contracts";

export const interviewWebSocketBodySchema = Type.Object({
  type: Type.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL }),
  sessionId: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
  content: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_MESSAGE })),
  studioId: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
  config: Type.Optional(sessionConfigSchema),
});

export type InterviewWebSocketBody = StaticParse<typeof interviewWebSocketBodySchema>;
