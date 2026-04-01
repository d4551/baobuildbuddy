import { StandardSchemaV1 } from "baobox";
import Type, { type StaticParse } from "baobox";
export type RouteSetState = {
    status?: number | string;
};
export declare const awardXpBodySchema: Type.TObject<{
    readonly amount: Type.TNumber;
    readonly reason: Type.TString;
}, "reason" | "amount", never>;
export type AwardXpBody = StaticParse<typeof awardXpBodySchema>;
export declare const challengeIdParamsSchema: Type.TObject<{
    readonly id: Type.TString;
}, "id", never>;
export type ChallengeIdParams = StaticParse<typeof challengeIdParamsSchema>;
export declare const awardXpBody: Type.TObject<{
    readonly amount: Type.TNumber;
    readonly reason: Type.TString;
}, "reason" | "amount", never> & StandardSchemaV1<unknown, {
    reason: string;
    amount: number;
} & {}>;
export declare const challengeIdParams: Type.TObject<{
    readonly id: Type.TString;
}, "id", never> & StandardSchemaV1<unknown, {
    id: string;
} & {}>;
