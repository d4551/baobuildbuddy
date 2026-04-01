import {
  SCHEMA_MAX_LENGTH_ID,
  SCHEMA_MAX_LENGTH_MESSAGE,
} from "@bao/shared/constants/schema-limits";
import Type, { type StaticParse } from "baobox";

export const chatWebSocketBodySchema = Type.Object({
  content: Type.String({ maxLength: SCHEMA_MAX_LENGTH_MESSAGE }),
  sessionId: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
});

export type ChatWebSocketBody = StaticParse<typeof chatWebSocketBodySchema>;
