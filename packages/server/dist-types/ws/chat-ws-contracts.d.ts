import Type, { type StaticParse } from "baobox";
export declare const chatWebSocketBodySchema: Type.TObject<{
    readonly content: Type.TString;
    readonly sessionId: Type.TOptional<Type.TString>;
}, "content", "sessionId">;
export type ChatWebSocketBody = StaticParse<typeof chatWebSocketBodySchema>;
