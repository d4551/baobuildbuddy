import type { DailyChallenge } from "@bao/shared";
export declare function buildDailyChallengesView(dailyChallenges: Record<string, string[]>, now: Date): DailyChallenge[];
export declare function completeChallengeState(input: {
    challengeId: string;
    dailyChallenges: Record<string, string[]>;
    now: Date;
}): {
    challenge: DailyChallenge;
    updatedChallenges: Record<string, string[]>;
} | null;
