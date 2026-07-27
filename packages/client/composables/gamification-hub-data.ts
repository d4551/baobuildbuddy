import type {
  Achievement,
  DailyChallenge,
  UserGamificationData,
} from "@bao/shared/types/gamification";
import type { JsonValue } from "@bao/shared/utils/json";
import { isRecord } from "@bao/shared/utils/type-guards";
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

export function toWeeklyTrend(value: JsonValue): GamificationWeeklyTrend | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.challengesCompleted !== "number" ||
    typeof value.xpEarned !== "number" ||
    typeof value.actionsCount !== "number" ||
    typeof value.topCategory !== "string"
  ) {
    return null;
  }
  return {
    challengesCompleted: value.challengesCompleted,
    xpEarned: value.xpEarned,
    actionsCount: value.actionsCount,
    topCategory: value.topCategory,
  };
}

export function toMonthlyTrend(value: JsonValue): GamificationMonthlyTrend | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.totalXP !== "number" ||
    typeof value.levelsGained !== "number" ||
    typeof value.achievementsUnlocked !== "number" ||
    typeof value.challengesCompleted !== "number" ||
    typeof value.actionsCount !== "number" ||
    typeof value.streakDays !== "number"
  ) {
    return null;
  }
  return {
    totalXP: value.totalXP,
    levelsGained: value.levelsGained,
    achievementsUnlocked: value.achievementsUnlocked,
    challengesCompleted: value.challengesCompleted,
    actionsCount: value.actionsCount,
    streakDays: value.streakDays,
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
  if (response.data === null) {
    throw new Error(fallbackMessage);
  }
  return response.data;
}

export async function fetchOptionalTrend(
  request: Promise<ApiEnvelope<JsonValue>>,
): Promise<JsonValue | null> {
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
