import type { GamificationStats, UserGamificationData } from "@bao/shared";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { gamification } from "../db/schema/schema-modules";
import {
  GAMIFICATION_DEFAULT_ID,
  MAX_ACTION_HISTORY,
  type ActionHistoryEntry,
} from "./gamification-definitions";
import { appendActionHistoryEntry } from "./gamification-progress";

function toUserGamificationData(row: typeof gamification.$inferSelect): UserGamificationData {
  const progress: UserGamificationData = {
    xp: row.xp || 0,
    level: row.level || 1,
    achievements: row.achievements || [],
    dailyChallenges: row.dailyChallenges || {},
    longestStreak: row.longestStreak || 0,
    currentStreak: row.currentStreak || 0,
    stats: row.stats || {},
  };
  if (row.lastActiveDate) {
    progress.lastActiveDate = row.lastActiveDate;
  }
  return progress;
}

export async function getOrCreateGamificationProgress(
  id: string = GAMIFICATION_DEFAULT_ID,
): Promise<UserGamificationData> {
  const results = await db.select().from(gamification).where(eq(gamification.id, id));

  if (results.length > 0) {
    return toUserGamificationData(results[0]);
  }

  const now = new Date().toISOString();
  await db.insert(gamification).values({
    id,
    xp: 0,
    level: 1,
    achievements: [],
    dailyChallenges: {},
    longestStreak: 0,
    currentStreak: 0,
    stats: {},
    createdAt: now,
    updatedAt: now,
  });

  return {
    xp: 0,
    level: 1,
    achievements: [],
    dailyChallenges: {},
    longestStreak: 0,
    currentStreak: 0,
    stats: {},
  };
}

export async function persistAwardedXP(input: {
  actionEntry: ActionHistoryEntry;
  id: string;
  newLevel: number;
  newXP: number;
  stats: Partial<GamificationStats> & { actionHistory: ActionHistoryEntry[] };
}): Promise<void> {
  const actionHistory = appendActionHistoryEntry(
    input.stats.actionHistory,
    input.actionEntry,
    MAX_ACTION_HISTORY,
  );

  await db
    .update(gamification)
    .set({
      xp: input.newXP,
      level: input.newLevel,
      lastActiveDate: input.actionEntry.timestamp,
      stats: { ...input.stats, actionHistory },
      updatedAt: input.actionEntry.timestamp,
    })
    .where(eq(gamification.id, input.id));
}

export async function persistAchievements(input: {
  achievements: string[];
  id: string;
  updatedAt: string;
}): Promise<void> {
  await db
    .update(gamification)
    .set({
      achievements: input.achievements,
      updatedAt: input.updatedAt,
    })
    .where(eq(gamification.id, input.id));
}

export async function persistDailyChallenges(input: {
  dailyChallenges: Record<string, string[]>;
  id: string;
  updatedAt: string;
}): Promise<void> {
  await db
    .update(gamification)
    .set({
      dailyChallenges: input.dailyChallenges,
      updatedAt: input.updatedAt,
    })
    .where(eq(gamification.id, input.id));
}

export async function persistStreak(input: {
  currentStreak: number;
  id: string;
  lastActiveDate: string;
  longestStreak: number;
  updatedAt: string;
}): Promise<void> {
  await db
    .update(gamification)
    .set({
      currentStreak: input.currentStreak,
      longestStreak: input.longestStreak,
      lastActiveDate: input.lastActiveDate,
      updatedAt: input.updatedAt,
    })
    .where(eq(gamification.id, input.id));
}

export async function persistStats(input: {
  id: string;
  stats: Partial<GamificationStats>;
  updatedAt: string;
}): Promise<void> {
  await db
    .update(gamification)
    .set({
      stats: input.stats,
      updatedAt: input.updatedAt,
    })
    .where(eq(gamification.id, input.id));
}
