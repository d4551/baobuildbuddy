import type { Static } from "typebox";
import { SCHEMA_MAX_LENGTH_RUN_ID } from "@bao/shared/constants/schema-limits";
import { t } from "elysia";

export const automationWebSocketBodySchema = t.Object({
  type: t.Union([t.Literal("subscribe"), t.Literal("unsubscribe")]),
  runId: t.Optional(t.String({ minLength: 8, maxLength: SCHEMA_MAX_LENGTH_RUN_ID })),
});

export type AutomationWebSocketMessage = Static<typeof automationWebSocketBodySchema>;
