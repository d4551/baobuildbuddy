import Type, { type StaticParse } from "baobox";
export declare const automationWebSocketBodySchema: Type.TObject<{
    readonly type: Type.TUnion<(Type.TLiteral<"subscribe"> | Type.TLiteral<"unsubscribe">)[]>;
    readonly runId: Type.TOptional<Type.TString>;
}, "type", "runId">;
export type AutomationWebSocketMessage = StaticParse<typeof automationWebSocketBodySchema>;
