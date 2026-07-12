import Type, { StandardSchemaV1, type StaticParse } from "baobox";
export declare const awardXpBodySchema: Type.TObject<{
    readonly amount: Type.TNumber;
    readonly reason: Type.TString;
}, "amount" | "reason", never>;
export type AwardXpBody = StaticParse<typeof awardXpBodySchema>;
export declare const challengeIdParamsSchema: Type.TObject<{
    readonly id: Type.TString;
}, "id", never>;
export type ChallengeIdParams = StaticParse<typeof challengeIdParamsSchema>;
export declare const awardXpBody: Type.TObject<{
    readonly amount: Type.TNumber;
    readonly reason: Type.TString;
}, "amount" | "reason", never> & StandardSchemaV1<unknown, {
    amount: number;
    reason: string;
} & {}>;
export declare const challengeIdParams: Type.TObject<{
    readonly id: Type.TString;
}, "id", never> & StandardSchemaV1<unknown, {
    id: string;
} & {}>;
