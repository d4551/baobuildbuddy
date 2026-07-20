import type {
  Achievement,
  DailyChallenge,
  UserGamificationData,
} from "@bao/shared/types/gamification";
import type { ApiEnvelope } from "~/types/client-api-contracts";
import { getErrorMessage } from "~/utils/errors";

export interface GamificationWeeklyTrend {
  readonly challengesCompleted: number;
  readonly xpEarned: number;
  readonly actionsCount: number;
  readonly topCategory: string;
}

export interface GamificationMonthlyTrend {
  readonly totalXP: number;
  readonly levelsGained: number;
  readonly achievementsUnlocked: number;
  readonly challengesCompleted: number;
  readonly actionsCount: number;
  readonly streakDays: number;
}

export interface GamificationHubData {
  readonly progress: UserGamificationData;
  readonly achievements: readonly Achievement[];
  readonly challenges: readonly DailyChallenge[];
  readonly weekly: GamificationWeeklyTrend | null;
  readonly monthly: GamificationMonthlyTrend | null;
}

export function toWeeklyTrend(value: unknown): GamificationWeeklyTrend | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (
    typeof row.challengesCompleted !== "number" ||
    typeof row.xpEarned !== "number" ||
    typeof row.actionsCount !== "number" ||
    typeof row.topCategory !== "string"
  ) {
    return null;
  }
  return {
    challengesCompleted: row.challengesCompleted,
    xpEarned: row.xpEarned,
    actionsCount: row.actionsCount,
    topCategory: row.topCategory,
  };
}

export function toMonthlyTrend(value: unknown): GamificationMonthlyTrend | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (
    typeof row.totalXP !== "number" ||
    typeof row.levelsGained !== "number" ||
    typeof row.achievementsUnlocked !== "number" ||
    typeof row.challengesCompleted !== "number" ||
    typeof row.actionsCount !== "number" ||
    typeof row.streakDays !== "number"
  ) {
    return null;
  }
  return {
    totalXP: row.totalXP,
    levelsGained: row.levelsGained,
    achievementsUnlocked: row.achievementsUnlocked,
    challengesCompleted: row.challengesCompleted,
    actionsCount: row.actionsCount,
    streakDays: row.streakDays,
  };
}

export async function requestGamificationData<T>(
  request: Promise<ApiEnvelope<T>>,
  fallbackMessage: string,
): Promise<T> {
  const response = await request;
  if (response.error) {
    throw new Error(getErrorMessage(response.error, fallbackMessage));
  }
  return response.data as T;
}

export async function fetchOptionalTrend(
  request: Promise<ApiEnvelope<unknown>>,
): Promise<unknown> {
  const response = await request;
  if (response.error) {
    return null;
  }
  return response.data;
}

export function isGamificationEmpty(payload: GamificationHubData): boolean {
  return (
    payload.progress.xp === 0 &&
    payload.achievements.length === 0 &&
    payload.challenges.length === 0
  );
}
