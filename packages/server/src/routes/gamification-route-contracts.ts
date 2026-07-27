import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_CREATED,
  HTTP_STATUS_OK,
} from "@bao/shared/constants/http";
import { SCHEMA_MAX_LENGTH_ID, SCHEMA_MAX_LENGTH_SHORT } from "@bao/shared/constants/schema-limits";
import { t } from "elysia";
import type { Static } from "typebox";
import { simpleErrorResponseSchema } from "./route-error-envelope";

export const awardXpBodySchema = t.Object({
  amount: t.Number({ minimum: 0, maximum: 10000 }),
  reason: t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
});

export type AwardXpBody = Static<typeof awardXpBodySchema>;

export const challengeIdParamsSchema = t.Object(
  {
    id: t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
  },
  { required: ["id"] },
);

export type ChallengeIdParams = Static<typeof challengeIdParamsSchema>;

export const awardXpBody = awardXpBodySchema;
export const challengeIdParams = challengeIdParamsSchema;

const jsonNumberRecordSchema = t.Record(t.String(), t.Number());

const gamificationActionHistoryEntrySchema = t.Object({
  action: t.String(),
  xpGained: t.Number(),
  multiplier: t.Optional(t.Number()),
  timestamp: t.String(),
});

const gamificationStatsResponseSchema = t.Object({
  profileComplete: t.Optional(t.Number()),
  skillsMapped: t.Optional(t.Number()),
  portfolioItems: t.Optional(t.Number()),
  jobApplications: t.Optional(t.Number()),
  chatSessions: t.Optional(t.Number()),
  resumesGenerated: t.Optional(t.Number()),
  coverLettersGenerated: t.Optional(t.Number()),
  savedJobs: t.Optional(t.Number()),
  jobsSaved: t.Optional(t.Number()),
  interviewScore: t.Optional(t.Number()),
  dataExported: t.Optional(t.Number()),
  earlyLogin: t.Optional(t.Number()),
  totalTimeSpent: t.Optional(t.Number()),
  featuresUsed: t.Optional(t.Number()),
  dailyStreak: t.Optional(t.Number()),
  weeklyProgress: t.Optional(t.Number()),
  interviewsCompleted: t.Optional(t.Number()),
  studiosExplored: t.Optional(t.Number()),
  actionHistory: t.Optional(t.Array(gamificationActionHistoryEntrySchema)),
});

export const gamificationProgressResponseSchema = t.Object({
  xp: t.Number(),
  level: t.Number(),
  achievements: t.Array(t.String()),
  dailyChallenges: t.Record(t.String(), t.Array(t.String())),
  longestStreak: t.Number(),
  currentStreak: t.Number(),
  lastActiveDate: t.Optional(t.String()),
  stats: gamificationStatsResponseSchema,
  xpForNextLevel: t.Optional(t.Number()),
  streak: t.Optional(t.Number()),
});

export const levelUpResultSchema = t.Object({
  xpGained: t.Number(),
  oldLevel: t.Number(),
  newLevel: t.Number(),
  oldTitle: t.String(),
  newTitle: t.String(),
  unlockedFeatures: t.Array(t.String()),
  bonusXP: t.Optional(t.Number()),
});

export const awardXpResponseSchema = t.Object({
  xp: t.Number(),
  level: t.Number(),
  leveledUp: t.Boolean(),
  levelUp: t.Union([levelUpResultSchema, t.Null()]),
  reason: t.String(),
  message: t.String(),
});

export const achievementResponseSchema = t.Object({
  id: t.String(),
  name: t.String(),
  description: t.String(),
  icon: t.String(),
  iconType: t.Union([t.Literal("emoji"), t.Literal("custom")]),
  category: t.Union([
    t.Literal("progress"),
    t.Literal("social"),
    t.Literal("skill"),
    t.Literal("special"),
    t.Literal("milestone"),
  ]),
  xpReward: t.Number(),
  requirements: jsonNumberRecordSchema,
  unlocked: t.Boolean(),
  unlockedAt: t.Optional(t.String()),
  rarity: t.Union([
    t.Literal("common"),
    t.Literal("rare"),
    t.Literal("epic"),
    t.Literal("legendary"),
  ]),
  hidden: t.Optional(t.Boolean()),
});

export const dailyChallengeResponseSchema = t.Object({
  id: t.String(),
  name: t.String(),
  description: t.String(),
  icon: t.String(),
  iconType: t.Union([t.Literal("emoji"), t.Literal("custom")]),
  xpReward: t.Number(),
  category: t.Union([
    t.Literal("profile"),
    t.Literal("job_search"),
    t.Literal("skill_building"),
    t.Literal("social"),
    t.Literal("engagement"),
  ]),
  completed: t.Boolean(),
  requirements: t.Optional(jsonNumberRecordSchema),
  validUntil: t.Optional(t.String()),
  progress: t.Optional(t.Number()),
  goal: t.Optional(t.Number()),
});

export const challengesListResponseSchema = t.Object({
  date: t.String(),
  challenges: t.Array(dailyChallengeResponseSchema),
  completedCount: t.Number(),
  totalCount: t.Number(),
});

export const challengeCompleteResponseSchema = t.Object({
  message: t.String(),
  challengeId: t.Optional(t.String()),
  completed: t.Boolean(),
  totalXP: t.Optional(t.Number()),
  level: t.Optional(t.Number()),
});

export const weeklyProgressResponseSchema = t.Object({
  challengesCompleted: t.Number(),
  xpEarned: t.Number(),
  actionsCount: t.Number(),
  days: t.Array(
    t.Object({
      date: t.String(),
      actions: t.Number(),
      xpEarned: t.Number(),
    }),
  ),
  topCategory: t.String(),
});

export const monthlyStatsResponseSchema = t.Object({
  totalXP: t.Number(),
  levelsGained: t.Number(),
  achievementsUnlocked: t.Number(),
  challengesCompleted: t.Number(),
  actionsCount: t.Number(),
  streakDays: t.Number(),
});

export const gamificationProgressResponses = {
  [HTTP_STATUS_OK]: gamificationProgressResponseSchema,
};

export const awardXpResponses = {
  [HTTP_STATUS_OK]: awardXpResponseSchema,
  [HTTP_STATUS_BAD_REQUEST]: simpleErrorResponseSchema,
};

export const achievementsResponses = {
  [HTTP_STATUS_OK]: t.Array(achievementResponseSchema),
};

export const challengesListResponses = {
  [HTTP_STATUS_OK]: challengesListResponseSchema,
};

export const challengeCompleteResponses = {
  [HTTP_STATUS_OK]: challengeCompleteResponseSchema,
  [HTTP_STATUS_CREATED]: challengeCompleteResponseSchema,
  [HTTP_STATUS_BAD_REQUEST]: simpleErrorResponseSchema,
};

export const weeklyProgressResponses = {
  [HTTP_STATUS_OK]: weeklyProgressResponseSchema,
};

export const monthlyStatsResponses = {
  [HTTP_STATUS_OK]: monthlyStatsResponseSchema,
};
