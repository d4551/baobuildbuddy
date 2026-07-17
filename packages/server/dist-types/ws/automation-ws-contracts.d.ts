import type { Static } from "typebox";
export declare const automationWebSocketBodySchema: import("typebox").TObject<{
    type: import("typebox").TUnion<[import("typebox").TLiteral<"subscribe">, import("typebox").TLiteral<"unsubscribe">]>;
    runId: import("typebox").TOptional<import("typebox").TString>;
}>;
export type AutomationWebSocketMessage = Static<typeof automationWebSocketBodySchema>;
