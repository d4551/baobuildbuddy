import type { Static } from "typebox";
export declare const chatWebSocketBodySchema: import("typebox").TObject<{
    content: import("typebox").TString;
    sessionId: import("typebox").TOptional<import("typebox").TString>;
}>;
export type ChatWebSocketBody = Static<typeof chatWebSocketBodySchema>;
