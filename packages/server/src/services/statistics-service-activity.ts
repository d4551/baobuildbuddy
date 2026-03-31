import type { CareerProgress, WeeklyActivity } from "@bao/shared";
import { isRecord } from "@bao/shared";
import { STATISTICS_SKILL_COVERAGE_TARGET } from "@bao/shared/constants/statistics";

type ActionHistoryEntry = { action: string; xpGained: number; timestamp: string };

export const parseActionHistory = (value: unknown): ActionHistoryEntry[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((entry) => ({
      action: typeof entry.action === "string" ? entry.action : "other",
      xpGained: typeof entry.xpGained === "number" ? entry.xpGained : 0,
      timestamp: typeof entry.timestamp === "string" ? entry.timestamp : "",
    }))
    .filter((entry) => entry.timestamp.length > 0);
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
    100,
    Math.round((mappedSkills / STATISTICS_SKILL_COVERAGE_TARGET) * 100),
  );
  const offeredApplications = applicationStatuses.filter((status) => status === "offered").length;
  const applicationSuccessRate =
    applicationStatuses.length > 0
      ? Math.round((offeredApplications / applicationStatuses.length) * 100)
      : 0;

  return {
    skillCoverage,
    applicationSuccessRate,
    interviewTrend: [],
  };
};
