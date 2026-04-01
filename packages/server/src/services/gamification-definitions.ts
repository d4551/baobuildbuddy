import { SCHEMA_MAX_ITEMS_BOARDS } from "@bao/shared/constants/schema-limits";
import type { GamificationActionHistoryEntry } from "@bao/shared/types/gamification";
import { DEFAULT_PROFILE_ID } from "@bao/shared/types/settings-defaults";
import {
  ACHIEVEMENT_DEFINITIONS,
  GAMIFICATION_STAT_KEYS,
} from "./gamification-achievement-definitions";
import { DAILY_CHALLENGE_DEFINITIONS } from "./gamification-challenge-definitions";

export const GAMIFICATION_DEFAULT_ID = DEFAULT_PROFILE_ID;
export const MAX_ACTION_HISTORY = SCHEMA_MAX_ITEMS_BOARDS;
export const WEEK_DAYS = 7;
export type ActionHistoryEntry = GamificationActionHistoryEntry;
export type NumericGamificationStats = Partial<Record<string, number>>;
export type WeeklyDaySummary = { date: string; actions: number; xpEarned: number };
export type WeeklyProgressResult = {
  challengesCompleted: number;
  xpEarned: number;
  actionsCount: number;
  days: WeeklyDaySummary[];
  topCategory: string;
};

export { ACHIEVEMENT_DEFINITIONS, DAILY_CHALLENGE_DEFINITIONS, GAMIFICATION_STAT_KEYS };
