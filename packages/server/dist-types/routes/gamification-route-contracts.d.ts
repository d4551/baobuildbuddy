import type { Static } from "typebox";
export declare const awardXpBodySchema: import("typebox").TObject<{
    amount: import("typebox").TNumber;
    reason: import("typebox").TString;
}>;
export type AwardXpBody = Static<typeof awardXpBodySchema>;
export declare const challengeIdParamsSchema: import("typebox").TObject<{
    id: import("typebox").TString;
}>;
export type ChallengeIdParams = Static<typeof challengeIdParamsSchema>;
export declare const awardXpBody: import("typebox").TObject<{
    amount: import("typebox").TNumber;
    reason: import("typebox").TString;
}>;
export declare const challengeIdParams: import("typebox").TObject<{
    id: import("typebox").TString;
}>;
