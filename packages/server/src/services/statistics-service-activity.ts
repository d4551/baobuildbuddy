import { STATISTICS_SKILL_COVERAGE_TARGET } from "@bao/shared/constants/statistics";
import type { CareerProgress, WeeklyActivity } from "@bao/shared/types/search";
import { asJsonArray, isRecord } from "@bao/shared/utils/type-guards";
import { PERCENT_MAX } from "@bao/shared/constants/numeric";
const NUM_100 = 100;

type ActionHistoryEntry = { action: string; xpGained: number; timestamp: string };

export const parseActionHistory = <T>(value: T): ActionHistoryEntry[] => {
  const rawHistory = asJsonArray(value);
  if (!rawHistory) {
    return [];
  }

  const entries: ActionHistoryEntry[] = [];
  for (const entry of rawHistory) {
    if (!isRecord(entry)) {
      continue;
    }
    const action = typeof entry.action === "string" ? entry.action : "other";
    const xpGained = typeof entry.xpGained === "number" ? entry.xpGained : 0;
    const timestamp = typeof entry.timestamp === "string" ? entry.timestamp : "";
    if (timestamp.length === 0) {
      continue;
    }
    entries.push({ action, xpGained, timestamp });
  }
  return entries;
};

export const buildWeeklyActivity = (actionHistory: ActionHistoryEntry[]): WeeklyActivity => {
  const now = new Date();
  const days: Array<{ date: string; actions: number; xpEarned: number }> = [];
  const categoryCounts: Record<string, number> = {};

  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date(now);
    date.setDate(date.getDate() - index);
    const dateStr = date.toISOString().split("T")[0];
    const dayActions = actionHistory.filter((action) => action.timestamp?.startsWith(dateStr));
    const xpEarned = dayActions.reduce((sum, action) => sum + (action.xpGained || 0), 0);

    days.push({ date: dateStr, actions: dayActions.length, xpEarned });

    for (const action of dayActions) {
      categoryCounts[action.action || "other"] =
        (categoryCounts[action.action || "other"] || 0) + 1;
    }
  }

  return {
    days,
    topCategory:
      Object.entries(categoryCounts).sort(([, left], [, right]) => right - left)[0]?.[0] || "none",
    totalXP: days.reduce((sum, day) => sum + day.xpEarned, 0),
  };
};

export const buildCareerProgress = (
  mappedSkills: number,
  applicationStatuses: string[],
): CareerProgress => {
  const skillCoverage = Math.min(
    NUM_100,
    Math.round((mappedSkills / STATISTICS_SKILL_COVERAGE_TARGET) * PERCENT_MAX),
  );
  const offeredApplications = applicationStatuses.filter((status) => status === "offered").length;
  const applicationSuccessRate =
    applicationStatuses.length > 0
      ? Math.round((offeredApplications / applicationStatuses.length) * PERCENT_MAX)
      : 0;

  return {
    skillCoverage,
    applicationSuccessRate,
    interviewTrend: [],
  };
};
