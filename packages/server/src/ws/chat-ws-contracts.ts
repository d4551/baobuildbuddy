import type { Static } from "typebox";
import {
  SCHEMA_MAX_LENGTH_ID,
  SCHEMA_MAX_LENGTH_MESSAGE,
} from "@bao/shared/constants/schema-limits";
import { t } from "elysia";

export const chatWebSocketBodySchema = t.Object({
  content: t.String({ maxLength: SCHEMA_MAX_LENGTH_MESSAGE }),
  sessionId: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
});

export type ChatWebSocketBody = Static<typeof chatWebSocketBodySchema>;
