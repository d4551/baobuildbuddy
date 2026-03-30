import type { DailyChallenge } from "@bao/shared";
import { MS_PER_DAY } from "@bao/shared";
import { getDefinedChallenges } from "./gamification-progress";

export function buildDailyChallengesView(
  dailyChallenges: Record<string, string[]>,
  now: Date,
): DailyChallenge[] {
  const today = now.toISOString().split("T")[0];
  const todaysChallenges = dailyChallenges[today] || [];

  if (todaysChallenges.length > 0) {
    return getDefinedChallenges().map((challenge) => ({
      ...challenge,
      completed: todaysChallenges.includes(challenge.id),
    }));
  }

  return getDefinedChallenges().map((challenge) => ({
    ...challenge,
    completed: false,
    validUntil: new Date(now.getTime() + MS_PER_DAY).toISOString(),
  }));
}

export function completeChallengeState(input: {
  challengeId: string;
  dailyChallenges: Record<string, string[]>;
  now: Date;
}): { challenge: DailyChallenge; updatedChallenges: Record<string, string[]> } | null {
  const today = input.now.toISOString().split("T")[0];
  const todaysChallenges = input.dailyChallenges[today] || [];

  if (todaysChallenges.includes(input.challengeId)) {
    return null;
  }

  const challenge = getDefinedChallenges().find((candidate) => candidate.id === input.challengeId);
  if (!challenge) {
    return null;
  }

  return {
    challenge,
    updatedChallenges: {
      ...input.dailyChallenges,
      [today]: [...todaysChallenges, input.challengeId],
    },
  };
}
