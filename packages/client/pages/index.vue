<script setup lang="ts">
import type {
  DailyChallenge,
  DashboardStats,
  UserGamificationData,
  UserProfile,
} from "@bao/shared";
import { APP_BRAND, getXPProgress } from "@bao/shared";
import {
  DASHBOARD_ASYNC_DATA_KEY,
  DASHBOARD_COPY,
  DASHBOARD_QUICK_ACTIONS,
  DASHBOARD_RECENT_ACTIVITY_LIMIT,
  DASHBOARD_STAT_CARDS,
  DASHBOARD_TIME_CONSTANTS,
  type DashboardStatKey,
  getDashboardActivityEmoji,
  getWelcomeHeading,
} from "~/constants/dashboard";
import { getErrorMessage } from "~/utils/errors";

interface DashboardActivity {
  readonly type: string;
  readonly description: string;
  readonly timestamp: Date;
}

interface DashboardChallengeViewModel {
  readonly id: string;
  readonly name: string;
  readonly xpReward: number;
  readonly completed: boolean;
  readonly progress: number;
  readonly goal: number;
}

interface DashboardMetrics {
  readonly savedJobs: number;
  readonly resumeCount: number;
  readonly interviewSessionCount: number;
}

interface DashboardViewModel {
  readonly profile: UserProfile | null;
  readonly gamification: UserGamificationData | null;
  readonly dailyChallenge: DashboardChallengeViewModel | null;
  readonly recentActivity: readonly DashboardActivity[];
  readonly metrics: DashboardMetrics;
}

interface DailyChallengesResponse {
  readonly challenges: DailyChallenge[];
  readonly completedCount: number;
  readonly totalCount: number;
  readonly date: string;
}

interface EdenErrorPayload {
  readonly message?: string;
}

interface EdenErrorEnvelope {
  readonly value?: EdenErrorPayload;
}

interface EdenResult<T> {
  readonly data: T;
  readonly error?: EdenErrorEnvelope | null;
}

type DashboardUiState = "idle" | "loading" | "error" | "empty" | "success";

const api = useApi();
const { $toast } = useNuxtApp();

if (import.meta.server) {
  useServerSeoMeta({
    title: `${APP_BRAND.name} Dashboard`,
    description: DASHBOARD_COPY.seoDescription,
  });
}

const { data, status, error, refresh } = await useAsyncData<DashboardViewModel>(
  DASHBOARD_ASYNC_DATA_KEY,
  fetchDashboardViewModel,
  {
    lazy: false,
    server: true,
  },
);

const dashboard = computed(() => data.value ?? null);

const uiState = computed<DashboardUiState>(() => {
  if (status.value === "pending") return "loading";
  if (status.value === "error") return "error";
  if (status.value === "idle") return "idle";
  if (!dashboard.value || isDashboardEmpty(dashboard.value)) return "empty";
  return "success";
});

const welcomeHeading = computed(() => getWelcomeHeading(dashboard.value?.profile?.name));

const levelProgress = computed(() => {
  const gamification = dashboard.value?.gamification;
  if (!gamification) return 0;
  return Math.round(getXPProgress(gamification.xp).progress * 100);
});

const xpTarget = computed(() => {
  const gamification = dashboard.value?.gamification;
  if (!gamification) return 100;
  const { nextLevel } = getXPProgress(gamification.xp);
  return nextLevel ? nextLevel.minXP : gamification.xp;
});

watch(error, (nextError) => {
  if (import.meta.client && nextError) {
    $toast.error(getErrorMessage(nextError, DASHBOARD_COPY.loadErrorFallback));
  }
});

async function retryDashboardLoad() {
  await refresh();
}

function getMetricValue(statKey: DashboardStatKey): number {
  const metrics = dashboard.value?.metrics;
  if (!metrics) return 0;

  switch (statKey) {
    case "savedJobs":
      return metrics.savedJobs;
    case "resumeCount":
      return metrics.resumeCount;
    case "interviewSessionCount":
      return metrics.interviewSessionCount;
    default:
      return 0;
  }
}

function isDashboardEmpty(viewModel: DashboardViewModel): boolean {
  return (
    viewModel.metrics.savedJobs === 0 &&
    viewModel.metrics.resumeCount === 0 &&
    viewModel.metrics.interviewSessionCount === 0 &&
    viewModel.dailyChallenge === null &&
    viewModel.recentActivity.length === 0
  );
}

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
  if (challenges.length === 0) return null;
  const currentChallenge = challenges.find((challenge) => !challenge.completed) ?? challenges[0];
  return mapDailyChallenge(currentChallenge);
}

function resolveActivityType(action: string): string {
  const normalizedAction = action.toLowerCase();
  if (normalizedAction.includes("job")) return "job";
  if (normalizedAction.includes("resume")) return "resume";
  if (normalizedAction.includes("interview")) return "interview";
  if (normalizedAction.includes("portfolio")) return "portfolio";
  return "activity";
}

function getRecentActivity(progress: UserGamificationData | null): DashboardActivity[] {
  if (!progress?.stats || typeof progress.stats !== "object") {
    return [];
  }

  const actionHistory = (progress.stats as Record<string, unknown>).actionHistory;
  if (!Array.isArray(actionHistory)) {
    return [];
  }

  return actionHistory
    .slice(-DASHBOARD_RECENT_ACTIVITY_LIMIT)
    .reverse()
    .map((entry): DashboardActivity | null => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const normalizedEntry = entry as Record<string, unknown>;
      const action =
        typeof normalizedEntry.action === "string" ? normalizedEntry.action : "Activity";
      const timestampRaw =
        typeof normalizedEntry.timestamp === "string" ? normalizedEntry.timestamp : "";
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

function formatTimeAgo(timestamp: Date): string {
  const elapsed = Date.now() - timestamp.getTime();

  if (elapsed < DASHBOARD_TIME_CONSTANTS.millisecondsPerHour) {
    const minutes = Math.max(
      1,
      Math.floor(elapsed / DASHBOARD_TIME_CONSTANTS.millisecondsPerMinute),
    );
    return `${minutes}m ago`;
  }

  if (elapsed < DASHBOARD_TIME_CONSTANTS.millisecondsPerDay) {
    const hours = Math.max(1, Math.floor(elapsed / DASHBOARD_TIME_CONSTANTS.millisecondsPerHour));
    return `${hours}h ago`;
  }

  const days = Math.max(1, Math.floor(elapsed / DASHBOARD_TIME_CONSTANTS.millisecondsPerDay));
  return `${days}d ago`;
}

async function fetchDashboardViewModel(): Promise<DashboardViewModel> {
  const [profile, stats, gamification, challengeResponse] = await Promise.all([
    requestData<UserProfile>(
      api.user.profile.get() as Promise<EdenResult<UserProfile>>,
      "Failed to load user profile",
    ),
    requestData<DashboardStats>(
      api.stats.dashboard.get() as Promise<EdenResult<DashboardStats>>,
      "Failed to load dashboard metrics",
    ),
    requestData<UserGamificationData>(
      api.gamification.progress.get() as Promise<EdenResult<UserGamificationData>>,
      "Failed to load gamification progress",
    ),
    requestData<DailyChallengesResponse>(
      api.gamification.challenges.get() as Promise<EdenResult<DailyChallengesResponse>>,
      "Failed to load daily challenges",
    ),
  ]);

  return {
    profile,
    gamification,
    dailyChallenge: pickDailyChallenge(challengeResponse.challenges),
    recentActivity: getRecentActivity(gamification),
    metrics: {
      savedJobs: stats.jobs.saved,
      resumeCount: stats.resumes.count,
      interviewSessionCount: stats.interviews.totalSessions,
    },
  };
}

async function requestData<T>(
  request: Promise<EdenResult<T>>,
  fallbackMessage: string,
): Promise<T> {
  const response = await request;
  if (response.error) {
    throw new Error(response.error.value?.message ?? fallbackMessage);
  }
  return response.data;
}
</script>

<template>
  <section class="space-y-6" aria-labelledby="dashboard-title">
    <header class="space-y-1">
      <h1 id="dashboard-title" class="text-3xl font-bold">{{ DASHBOARD_COPY.pageTitle }}</h1>
      <p class="text-sm text-base-content/60">{{ DASHBOARD_COPY.metricsSummaryLabel }}</p>
    </header>

    <LoadingSkeleton v-if="uiState === 'loading' || uiState === 'idle'" :lines="6" />

    <div v-else-if="uiState === 'error'" class="alert alert-error" role="alert">
      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>{{ getErrorMessage(error, DASHBOARD_COPY.loadErrorFallback) }}</span>
      <button type="button" class="btn btn-sm" @click="retryDashboardLoad">
        {{ DASHBOARD_COPY.retryButtonLabel }}
      </button>
    </div>

    <div v-else-if="uiState === 'empty'" class="card bg-base-200 card-border">
      <div class="card-body items-start gap-3">
        <h2 class="card-title">{{ DASHBOARD_COPY.emptyStateTitle }}</h2>
        <p class="text-sm text-base-content/70">{{ DASHBOARD_COPY.emptyStateDescription }}</p>
        <div class="card-actions">
          <NuxtLink to="/setup" class="btn btn-primary">{{ DASHBOARD_COPY.setupCtaLabel }}</NuxtLink>
        </div>
      </div>
    </div>

    <div v-else class="space-y-6">
      <section class="card bg-gradient-to-br from-primary to-secondary text-primary-content">
        <div class="card-body gap-3">
          <h2 class="card-title text-2xl">{{ welcomeHeading }}</h2>
          <p class="text-base opacity-90">{{ DASHBOARD_COPY.welcomeDescription }}</p>
          <div v-if="!dashboard?.profile?.name" class="card-actions mt-2">
            <NuxtLink to="/setup" class="btn btn-primary-content">{{ DASHBOARD_COPY.setupCtaLabel }}</NuxtLink>
          </div>
        </div>
      </section>

      <section v-if="dashboard?.gamification" class="card bg-base-200">
        <div class="card-body">
          <div class="flex items-center justify-between gap-6">
            <div class="flex-1 space-y-2">
              <div class="flex items-center gap-3">
                <span class="text-2xl" aria-hidden="true">🎮</span>
                <div>
                  <p class="text-sm text-base-content/60">
                    {{ DASHBOARD_COPY.levelLabel }} {{ dashboard.gamification.level }}
                  </p>
                  <p class="font-bold">{{ dashboard.gamification.xp }} / {{ xpTarget }} XP</p>
                </div>
              </div>
              <progress class="progress progress-primary w-full" :value="levelProgress" max="100"></progress>
            </div>

            <div v-if="dashboard.gamification.currentStreak" class="text-center">
              <div class="text-3xl" aria-hidden="true">🔥</div>
              <p class="text-2xl font-bold">{{ dashboard.gamification.currentStreak }}</p>
              <p class="text-xs text-base-content/60">{{ DASHBOARD_COPY.streakLabel }}</p>
            </div>
          </div>
        </div>
      </section>

      <section class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <NuxtLink
          v-for="statCard in DASHBOARD_STAT_CARDS"
          :key="statCard.id"
          :to="statCard.to"
          class="card bg-base-200 hover:bg-base-300 transition-colors"
          :aria-label="`${statCard.title}: ${getMetricValue(statCard.statKey)}. ${statCard.ctaLabel}`"
        >
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-base-content/60 mb-1">{{ statCard.title }}</p>
                <p class="text-3xl font-bold">{{ getMetricValue(statCard.statKey) }}</p>
              </div>
              <svg class="w-12 h-12 opacity-20" :class="statCard.accentClass" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="statCard.iconPath" />
              </svg>
            </div>
            <p class="text-xs mt-2" :class="statCard.accentClass">{{ statCard.ctaLabel }}</p>
          </div>
        </NuxtLink>
      </section>

      <section class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div v-if="dashboard?.dailyChallenge" class="card bg-base-200">
          <div class="card-body">
            <h2 class="card-title text-lg mb-3">{{ DASHBOARD_COPY.dailyChallengeTitle }}</h2>
            <div class="card bg-base-100">
              <div class="card-body p-4 gap-3">
                <div class="flex items-center justify-between gap-3">
                  <h3 class="font-semibold">{{ dashboard.dailyChallenge.name }}</h3>
                  <span class="badge badge-primary">+{{ dashboard.dailyChallenge.xpReward }} XP</span>
                </div>
                <div class="flex items-center gap-3">
                  <progress
                    class="progress flex-1"
                    :class="dashboard.dailyChallenge.completed ? 'progress-success' : 'progress-primary'"
                    :value="dashboard.dailyChallenge.progress"
                    :max="dashboard.dailyChallenge.goal"
                  ></progress>
                  <span class="text-sm font-medium">
                    {{ dashboard.dailyChallenge.progress }} / {{ dashboard.dailyChallenge.goal }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card bg-base-200">
          <div class="card-body">
            <h2 class="card-title text-lg mb-3">{{ DASHBOARD_COPY.recentActivityTitle }}</h2>
            <div class="space-y-3">
              <div
                v-for="(activity, index) in dashboard?.recentActivity"
                :key="`${activity.timestamp.toISOString()}-${index}`"
                class="flex items-start gap-3"
              >
                <div class="avatar placeholder">
                  <div class="bg-primary text-primary-content rounded-full w-8">
                    <span class="text-xs">{{ getDashboardActivityEmoji(activity.type) }}</span>
                  </div>
                </div>
                <div class="flex-1">
                  <p class="text-sm">{{ activity.description }}</p>
                  <p class="text-xs text-base-content/60">{{ formatTimeAgo(activity.timestamp) }}</p>
                </div>
              </div>

              <p
                v-if="(dashboard?.recentActivity.length ?? 0) === 0"
                class="text-sm text-center text-base-content/60 py-4"
              >
                {{ DASHBOARD_COPY.recentActivityEmptyLabel }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section class="card bg-base-200">
        <div class="card-body">
          <h2 class="card-title text-lg mb-4">{{ DASHBOARD_COPY.quickActionsTitle }}</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <NuxtLink
              v-for="action in DASHBOARD_QUICK_ACTIONS"
              :key="action.id"
              :to="action.to"
              class="btn btn-outline justify-start sm:justify-center"
              :aria-label="action.label"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="action.iconPath" />
              </svg>
              {{ action.label }}
            </NuxtLink>
          </div>
        </div>
      </section>
    </div>
  </section>
</template>
