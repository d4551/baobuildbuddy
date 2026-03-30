import type {
  DailyChallenge,
  DashboardStats,
  UserGamificationData,
} from "@bao/shared";
import { isRecord } from "@bao/shared";
import { toUserProfile } from "~/composables/api-normalizer-user";
import { requireValue } from "~/composables/async-flow";
import {
  DASHBOARD_ACTIVITY_FALLBACK_KEY,
  DASHBOARD_ERROR_KEYS,
  DASHBOARD_RECENT_ACTIVITY_LIMIT,
} from "~/constants/dashboard";
import type {
  DashboardActivity,
  DashboardChallengeViewModel,
  DashboardViewModel,
  DailyChallengesResponse,
} from "~/components/dashboard/dashboard-page-contracts";
import { getErrorMessage } from "~/utils/errors";

type TranslateFn = (key: string, values?: Record<string, unknown>) => string;

function mapDailyChallenge(challenge: DailyChallenge): DashboardChallengeViewModel {
  const goal = typeof challenge.goal === "number" && challenge.goal > 0 ? challenge.goal : 1;
  const progress =
    typeof challenge.progress === "number" ? challenge.progress : challenge.completed ? goal : 0;

  return {
    id: challenge.id,
    name: challenge.name,
    xpReward: challenge.xpReward,
    completed: challenge.completed,
    progress,
    goal,
  };
}

function pickDailyChallenge(
  challenges: readonly DailyChallenge[],
): DashboardChallengeViewModel | null {
  if (challenges.length === 0) {
    return null;
  }

  const currentChallenge = challenges.find((challenge) => !challenge.completed) ?? challenges[0];
  return currentChallenge ? mapDailyChallenge(currentChallenge) : null;
}

function resolveActivityType(action: string): string {
  const normalizedAction = action.toLowerCase();
  if (
    normalizedAction.includes("automation") ||
    normalizedAction.includes("apply") ||
    normalizedAction.includes("scrape")
  ) {
    return "automation";
  }
  if (normalizedAction.includes("challenge") || normalizedAction.includes("xp")) {
    return "gamification";
  }
  if (normalizedAction.includes("job")) {
    return "job";
  }
  if (normalizedAction.includes("resume")) {
    return "resume";
  }
  if (normalizedAction.includes("interview")) {
    return "interview";
  }
  if (normalizedAction.includes("portfolio")) {
    return "portfolio";
  }
  return "activity";
}

function getRecentActivity(
  progress: UserGamificationData | null,
  t: TranslateFn,
): DashboardActivity[] {
  const statsValue = progress?.stats;
  if (!isRecord(statsValue)) {
    return [];
  }

  const actionHistory = statsValue.actionHistory;
  if (!Array.isArray(actionHistory)) {
    return [];
  }

  return actionHistory
    .slice(-DASHBOARD_RECENT_ACTIVITY_LIMIT)
    .reverse()
    .map((entry): DashboardActivity | null => {
      if (!isRecord(entry)) {
        return null;
      }

      const action =
        typeof entry.action === "string" ? entry.action : t(DASHBOARD_ACTIVITY_FALLBACK_KEY);
      const timestampRaw = typeof entry.timestamp === "string" ? entry.timestamp : "";
      const timestamp = timestampRaw ? new Date(timestampRaw) : new Date();
      if (Number.isNaN(timestamp.getTime())) {
        return null;
      }

      return {
        type: resolveActivityType(action),
        description: action,
        timestamp,
      };
    })
    .filter((entry): entry is DashboardActivity => entry !== null);
}

async function requestData<T>(
  request: Promise<{ data: T | null; error?: unknown }>,
  fallbackMessage: string,
): Promise<T> {
  const response = await request;
  if (response.error) {
    throw new Error(getErrorMessage(response.error, fallbackMessage));
  }
  if (response.data == null) {
    throw new Error(fallbackMessage);
  }
  return response.data;
}

export async function fetchDashboardViewModel(
  api: ReturnType<typeof useApi>,
  t: TranslateFn,
): Promise<DashboardViewModel> {
  const [profile, stats, gamification, challengeResponse] = await Promise.all([
    requestData<unknown>(api.user.profile.get(), t(DASHBOARD_ERROR_KEYS.profileLoadFallback)).then(
      (rawProfile) =>
        requireValue(toUserProfile(rawProfile), t(DASHBOARD_ERROR_KEYS.profileLoadFallback)),
    ),
    requestData<DashboardStats>(
      api.stats.dashboard.get(),
      t(DASHBOARD_ERROR_KEYS.metricsLoadFallback),
    ),
    requestData<UserGamificationData>(
      api.gamification.progress.get(),
      t(DASHBOARD_ERROR_KEYS.gamificationLoadFallback),
    ),
    requestData<DailyChallengesResponse>(
      api.gamification.challenges.get(),
      t(DASHBOARD_ERROR_KEYS.challengesLoadFallback),
    ),
  ]);

  return {
    profile,
    gamification,
    dailyChallenge: pickDailyChallenge(challengeResponse.challenges),
    recentActivity: getRecentActivity(gamification, t),
    metrics: {
      profileCompleteness: stats.profile.completeness,
      savedJobs: stats.jobs.saved,
      appliedJobs: stats.jobs.applied,
      resumeCount: stats.resumes.count,
      coverLetterCount: stats.coverLetters.count,
      portfolioProjectCount: stats.portfolio.projectCount,
      automationRuns: stats.automation.totalRuns,
      successfulAutomationRuns: stats.automation.successfulRuns,
      mappedSkillsCount: stats.skills.mappedCount,
      interviewSessionCount: stats.interviews.totalSessions,
    },
  };
}

export function isDashboardEmpty(viewModel: DashboardViewModel): boolean {
  return (
    viewModel.metrics.savedJobs === 0 &&
    viewModel.metrics.appliedJobs === 0 &&
    viewModel.metrics.resumeCount === 0 &&
    viewModel.metrics.coverLetterCount === 0 &&
    viewModel.metrics.automationRuns === 0 &&
    viewModel.metrics.mappedSkillsCount === 0 &&
    viewModel.metrics.interviewSessionCount === 0 &&
    viewModel.dailyChallenge === null &&
    viewModel.recentActivity.length === 0
  );
}

export function toFlowStats(viewModel: DashboardViewModel): DashboardStats {
  return {
    profile: {
      completeness: viewModel.metrics.profileCompleteness,
    },
    jobs: {
      saved: viewModel.metrics.savedJobs,
      applied: viewModel.metrics.appliedJobs,
      interviewing: 0,
      offered: 0,
    },
    resumes: {
      count: viewModel.metrics.resumeCount,
      lastUpdated: null,
    },
    coverLetters: {
      count: viewModel.metrics.coverLetterCount,
    },
    portfolio: {
      projectCount: viewModel.metrics.portfolioProjectCount,
    },
    interviews: {
      totalSessions: viewModel.metrics.interviewSessionCount,
      averageScore: null,
    },
    skills: {
      mappedCount: viewModel.metrics.mappedSkillsCount,
    },
    gamification: {
      level: viewModel.gamification?.level ?? 0,
      xp: viewModel.gamification?.xp ?? 0,
      achievements: viewModel.gamification?.achievements.length ?? 0,
      streak: viewModel.gamification?.currentStreak ?? 0,
    },
    ai: {
      chatMessages: 0,
      chatSessions: 0,
    },
    automation: {
      totalRuns: viewModel.metrics.automationRuns,
      successfulRuns: viewModel.metrics.successfulAutomationRuns,
      successRate: 0,
      todayRuns: 0,
      recentRuns: [],
    },
  };
}
