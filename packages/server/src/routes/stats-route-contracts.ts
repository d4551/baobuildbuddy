import { HTTP_STATUS_OK } from "@bao/shared/constants/http";
import { t } from "elysia";

export const automationStatsSchema = t.Object({
  totalRuns: t.Number(),
  successfulRuns: t.Number(),
  successRate: t.Number(),
  todayRuns: t.Number(),
  recentRuns: t.Array(
    t.Object({
      id: t.String(),
      type: t.String(),
      status: t.String(),
      createdAt: t.String(),
    }),
  ),
});

export const statsDashboardResponseSchema = t.Object({
  profile: t.Object({ completeness: t.Number() }),
  jobs: t.Object({
    saved: t.Number(),
    applied: t.Number(),
    interviewing: t.Number(),
    offered: t.Number(),
  }),
  resumes: t.Object({
    count: t.Number(),
    lastUpdated: t.Union([t.String(), t.Null()]),
  }),
  coverLetters: t.Object({ count: t.Number() }),
  portfolio: t.Object({ projectCount: t.Number() }),
  interviews: t.Object({
    totalSessions: t.Number(),
    averageScore: t.Union([t.Number(), t.Null()]),
  }),
  skills: t.Object({ mappedCount: t.Number() }),
  ai: t.Object({
    chatMessages: t.Number(),
    chatSessions: t.Number(),
  }),
  gamification: t.Object({
    level: t.Number(),
    xp: t.Number(),
    achievements: t.Number(),
    streak: t.Number(),
  }),
  automation: automationStatsSchema,
});

export const statsWeeklyResponseSchema = t.Object({
  days: t.Array(
    t.Object({
      date: t.String(),
      actions: t.Number(),
      xpEarned: t.Number(),
    }),
  ),
  topCategory: t.String(),
  totalXP: t.Number(),
});

export const statsCareerResponseSchema = t.Object({
  skillCoverage: t.Number(),
  applicationSuccessRate: t.Number(),
  interviewTrend: t.Array(t.Number()),
});

export const statsDashboardResponses = {
  [HTTP_STATUS_OK]: statsDashboardResponseSchema,
};

export const statsWeeklyResponses = {
  [HTTP_STATUS_OK]: statsWeeklyResponseSchema,
};

export const statsCareerResponses = {
  [HTTP_STATUS_OK]: statsCareerResponseSchema,
};
