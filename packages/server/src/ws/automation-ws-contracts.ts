import { SCHEMA_MAX_LENGTH_RUN_ID } from "@bao/shared/constants/schema-limits";
import Type, { type StaticParse } from "baobox";

export const automationWebSocketBodySchema = Type.Object({
  type: Type.Union([Type.Literal("subscribe"), Type.Literal("unsubscribe")]),
  runId: Type.Optional(Type.String({ minLength: 8, maxLength: SCHEMA_MAX_LENGTH_RUN_ID })),
});

export type AutomationWebSocketMessage = StaticParse<typeof automationWebSocketBodySchema>;
