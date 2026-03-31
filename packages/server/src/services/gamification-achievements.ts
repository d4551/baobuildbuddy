import type { Achievement } from "@bao/shared/types/gamification";
import { ACHIEVEMENT_DEFINITIONS, type NumericGamificationStats } from "./gamification-definitions";
import { areAchievementRequirementsMet } from "./gamification-progress";

export function buildAchievementStatuses(unlockedIds: string[]): Achievement[] {
  const unlocked = new Set(unlockedIds);
  return ACHIEVEMENT_DEFINITIONS.map((achievement) => ({
    ...achievement,
    unlocked: unlocked.has(achievement.id),
  }));
}

export function findUnlockableAchievements(input: {
  achievements: Achievement[];
  existingStats: NumericGamificationStats;
  pendingStats: NumericGamificationStats;
}): Achievement[] {
  return input.achievements.filter(
    (achievement) =>
      !achievement.unlocked &&
      areAchievementRequirementsMet(achievement, input.pendingStats, input.existingStats),
  );
}
