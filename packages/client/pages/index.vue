<script setup lang="ts">
import type {
  DailyChallenge,
  DashboardStats,
  UserGamificationData,
  UserProfile,
} from "@bao/shared";
import { APP_BRAND, APP_ROUTES, getXPProgress } from "@bao/shared";
import { useI18n } from "vue-i18n";
import {
  DASHBOARD_A11Y_KEYS,
  DASHBOARD_ACTIVITY_FALLBACK_KEY,
  DASHBOARD_ASYNC_DATA_KEY,
  DASHBOARD_COPY_KEYS,
  DASHBOARD_DAILY_CHALLENGE_XP_LABEL_KEY,
  DASHBOARD_ERROR_KEYS,
  DASHBOARD_MOTIVATIONAL_PHRASE_KEYS,
  DASHBOARD_ONBOARDING_STEPS,
  DASHBOARD_PIPELINE_STATUS_KEYS,
  DASHBOARD_QUICK_ACTIONS,
  DASHBOARD_RECENT_ACTIVITY_LIMIT,
  DASHBOARD_RELATIVE_TIME_KEYS,
  DASHBOARD_STAT_CARDS,
  DASHBOARD_TIME_CONSTANTS,
  DASHBOARD_WELCOME_HEADING_KEYS,
  resolveDashboardPipelineSteps,
  type DashboardStatKey,
  type DashboardPipelineStepViewModel,
  getDashboardActivityEmoji,
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
  readonly appliedJobs: number;
  readonly resumeCount: number;
  readonly coverLetterCount: number;
  readonly automationRuns: number;
  readonly successfulAutomationRuns: number;
  readonly mappedSkillsCount: number;
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
const { t } = useI18n();

if (import.meta.server) {
  useServerSeoMeta({
    title: `${APP_BRAND.name} Dashboard`,
    description: t(DASHBOARD_COPY_KEYS.seoDescription),
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

const welcomeHeading = computed(() => {
  const profileName = dashboard.value?.profile?.name?.trim();
  if (profileName) {
    return t(DASHBOARD_WELCOME_HEADING_KEYS.named, { name: profileName });
  }
  return t(DASHBOARD_WELCOME_HEADING_KEYS.fallback);
});
const heroPhraseIndex = ref(0);
const activeHeroPhrase = computed(() => {
  const phraseKey =
    DASHBOARD_MOTIVATIONAL_PHRASE_KEYS[
      heroPhraseIndex.value % DASHBOARD_MOTIVATIONAL_PHRASE_KEYS.length
    ];
  return t(phraseKey);
});
let heroPhraseTimer: ReturnType<typeof setInterval> | null = null;

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

const pipelineSteps = computed<readonly DashboardPipelineStepViewModel[]>(() => {
  const metrics = dashboard.value?.metrics;
  if (!metrics) {
    return resolveDashboardPipelineSteps({
      savedJobs: 0,
      appliedJobs: 0,
      resumeCount: 0,
      coverLetterCount: 0,
      automationRuns: 0,
      successfulAutomationRuns: 0,
      mappedSkillsCount: 0,
      gamificationXp: 0,
    });
  }

  return resolveDashboardPipelineSteps({
    savedJobs: metrics.savedJobs,
    appliedJobs: metrics.appliedJobs,
    resumeCount: metrics.resumeCount,
    coverLetterCount: metrics.coverLetterCount,
    automationRuns: metrics.automationRuns,
    successfulAutomationRuns: metrics.successfulAutomationRuns,
    mappedSkillsCount: metrics.mappedSkillsCount,
    gamificationXp: dashboard.value?.gamification?.xp ?? 0,
  });
});

const nextPipelineStepLabel = computed(() => {
  const nextStep = pipelineSteps.value.find((step) => step.status !== "complete");
  if (!nextStep) {
    return t(DASHBOARD_PIPELINE_STATUS_KEYS.complete);
  }
  return t(DASHBOARD_COPY_KEYS.pipelineNextStepLabel, { step: t(nextStep.labelKey) });
});

onMounted(() => {
  heroPhraseTimer = setInterval(() => {
    heroPhraseIndex.value += 1;
  }, DASHBOARD_TIME_CONSTANTS.heroTextRotateIntervalMs);
});

onUnmounted(() => {
  if (heroPhraseTimer) {
    clearInterval(heroPhraseTimer);
    heroPhraseTimer = null;
  }
});

watch(error, (nextError) => {
  if (import.meta.client && nextError) {
    $toast.error(getErrorMessage(nextError, t(DASHBOARD_COPY_KEYS.loadErrorFallback)));
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
  if (
    normalizedAction.includes("automation") ||
    normalizedAction.includes("apply") ||
    normalizedAction.includes("scrape")
  ) {
    return "automation";
  }
  if (normalizedAction.includes("challenge") || normalizedAction.includes("xp"))
    return "gamification";
  if (normalizedAction.includes("job")) return "job";
  if (normalizedAction.includes("resume")) return "resume";
  if (normalizedAction.includes("interview")) return "interview";
  if (normalizedAction.includes("portfolio")) return "portfolio";
  return "activity";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getRecentActivity(progress: UserGamificationData | null): DashboardActivity[] {
  if (!isRecord(progress?.stats)) {
    return [];
  }

  const actionHistory = progress.stats.actionHistory;
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

function formatTimeAgo(timestamp: Date): string {
  const elapsed = Date.now() - timestamp.getTime();

  if (elapsed < DASHBOARD_TIME_CONSTANTS.millisecondsPerHour) {
    const minutes = Math.max(
      1,
      Math.floor(elapsed / DASHBOARD_TIME_CONSTANTS.millisecondsPerMinute),
    );
    return t(DASHBOARD_RELATIVE_TIME_KEYS.minutesAgo, { count: minutes });
  }

  if (elapsed < DASHBOARD_TIME_CONSTANTS.millisecondsPerDay) {
    const hours = Math.max(1, Math.floor(elapsed / DASHBOARD_TIME_CONSTANTS.millisecondsPerHour));
    return t(DASHBOARD_RELATIVE_TIME_KEYS.hoursAgo, { count: hours });
  }

  const days = Math.max(1, Math.floor(elapsed / DASHBOARD_TIME_CONSTANTS.millisecondsPerDay));
  return t(DASHBOARD_RELATIVE_TIME_KEYS.daysAgo, { count: days });
}

async function fetchDashboardViewModel(): Promise<DashboardViewModel> {
  const [profile, stats, gamification, challengeResponse] = await Promise.all([
    requestData<UserProfile>(api.user.profile.get(), t(DASHBOARD_ERROR_KEYS.profileLoadFallback)),
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
    recentActivity: getRecentActivity(gamification),
    metrics: {
      savedJobs: stats.jobs.saved,
      appliedJobs: stats.jobs.applied,
      resumeCount: stats.resumes.count,
      coverLetterCount: stats.coverLetters.count,
      automationRuns: stats.automation.totalRuns,
      successfulAutomationRuns: stats.automation.successfulRuns,
      mappedSkillsCount: stats.skills.mappedCount,
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
      <h1 id="dashboard-title" class="text-3xl font-bold">{{ t(DASHBOARD_COPY_KEYS.pageTitle) }}</h1>
      <p class="text-sm text-base-content/60">
        {{ t(DASHBOARD_COPY_KEYS.metricsSummaryLabel, { brand: APP_BRAND.name }) }}
      </p>
    </header>

    <LoadingSkeleton v-if="uiState === 'loading' || uiState === 'idle'" variant="stats" :lines="6" />

    <div v-else-if="uiState === 'error'" class="alert alert-error" role="alert">
      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>{{ getErrorMessage(error, t(DASHBOARD_COPY_KEYS.loadErrorFallback)) }}</span>
      <button
        type="button"
        class="btn btn-sm"
        :aria-label="t(DASHBOARD_COPY_KEYS.retryAria)"
        @click="retryDashboardLoad"
      >
        {{ t(DASHBOARD_COPY_KEYS.retryButtonLabel) }}
      </button>
    </div>

    <div v-else-if="uiState === 'empty'" class="card card-border bg-base-100">
      <div class="card-body items-start gap-4">
        <h2 class="card-title">{{ t(DASHBOARD_COPY_KEYS.emptyStateTitle) }}</h2>
        <p class="text-sm text-base-content/70">{{ t(DASHBOARD_COPY_KEYS.emptyStateDescription) }}</p>
        <h3 class="text-sm font-semibold">{{ t(DASHBOARD_COPY_KEYS.onboardingChecklistTitle) }}</h3>
        <ul class="steps steps-vertical w-full lg:steps-horizontal">
          <li v-for="step in DASHBOARD_ONBOARDING_STEPS" :key="step.id" class="step step-primary">
            <NuxtLink :to="step.to" class="link link-hover">
              {{ t(step.labelKey) }}
            </NuxtLink>
          </li>
        </ul>
        <div class="card-actions">
          <NuxtLink :to="APP_ROUTES.setup" class="btn btn-primary">
            {{ t(DASHBOARD_COPY_KEYS.setupCtaLabel) }}
          </NuxtLink>
        </div>
      </div>
    </div>

    <div v-else class="space-y-6">
      <section class="card bg-gradient-to-br from-primary to-secondary text-primary-content">
        <div class="card-body gap-3">
          <h2 class="card-title text-2xl">{{ welcomeHeading }}</h2>
          <p class="text-base opacity-90">{{ t(DASHBOARD_COPY_KEYS.welcomeDescription) }}</p>
          <div class="badge badge-outline badge-lg text-primary-content border-primary-content/40 text-rotate w-fit bg-transparent">
            <Transition name="hero-text-rotate" mode="out-in">
              <span :key="activeHeroPhrase">{{ activeHeroPhrase }}</span>
            </Transition>
          </div>
          <div v-if="!dashboard?.profile?.name" class="card-actions mt-2">
            <NuxtLink :to="APP_ROUTES.setup" class="btn btn-primary-content">
              {{ t(DASHBOARD_COPY_KEYS.setupCtaLabel) }}
            </NuxtLink>
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
                    {{ t(DASHBOARD_COPY_KEYS.levelLabel) }} {{ dashboard.gamification.level }}
                  </p>
                  <p class="font-bold">{{ dashboard.gamification.xp }} / {{ xpTarget }} XP</p>
                </div>
              </div>
              <progress
                class="progress progress-primary w-full"
                :value="levelProgress"
                max="100"
                :aria-label="t(DASHBOARD_A11Y_KEYS.levelProgressAria)"
              ></progress>
            </div>

            <div class="flex items-center gap-6">
              <div
                class="radial-progress text-primary"
                :style="`--value:${levelProgress}; --size:5.5rem; --thickness:0.4rem;`"
                role="progressbar"
                :aria-valuenow="levelProgress"
                aria-valuemin="0"
                aria-valuemax="100"
              >
                <span class="text-sm font-bold">{{ levelProgress }}%</span>
              </div>

              <div v-if="dashboard.gamification.currentStreak" class="text-center">
                <div class="text-3xl" aria-hidden="true">🔥</div>
                <p class="text-2xl font-bold">{{ dashboard.gamification.currentStreak }}</p>
                <p class="text-xs text-base-content/60">{{ t(DASHBOARD_COPY_KEYS.streakLabel) }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div class="stats stats-vertical md:stats-horizontal w-full bg-base-100 shadow">
          <NuxtLink
            v-for="statCard in DASHBOARD_STAT_CARDS"
            :key="statCard.id"
            :to="statCard.to"
            class="stat transition-colors hover:bg-base-200"
            :aria-label="t(DASHBOARD_A11Y_KEYS.statCardAria, { title: t(statCard.titleKey), value: getMetricValue(statCard.statKey), cta: t(statCard.ctaLabelKey) })"
          >
            <div class="stat-figure" :class="statCard.accentClass">
              <svg class="h-8 w-8 opacity-85" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="statCard.iconPath" />
              </svg>
            </div>
            <div class="stat-title">{{ t(statCard.titleKey) }}</div>
            <div class="stat-value text-3xl">{{ getMetricValue(statCard.statKey) }}</div>
            <div class="stat-desc" :class="statCard.accentClass">{{ t(statCard.ctaLabelKey) }}</div>
          </NuxtLink>
        </div>
      </section>

      <section class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div v-if="dashboard?.dailyChallenge" class="card bg-base-200">
          <div class="card-body">
            <h2 class="card-title text-lg mb-3">{{ t(DASHBOARD_COPY_KEYS.dailyChallengeTitle) }}</h2>
            <div class="card bg-base-100">
              <div class="card-body p-4 gap-3">
                <div class="flex items-center justify-between gap-3">
                  <h3 class="font-semibold">{{ dashboard.dailyChallenge.name }}</h3>
                  <span class="badge badge-primary">
                    {{ t(DASHBOARD_DAILY_CHALLENGE_XP_LABEL_KEY, { xp: dashboard.dailyChallenge.xpReward }) }}
                  </span>
                </div>
                <div class="flex items-center gap-3">
                  <progress
                    class="progress flex-1"
                    :class="dashboard.dailyChallenge.completed ? 'progress-success' : 'progress-primary'"
                    :value="dashboard.dailyChallenge.progress"
                    :max="dashboard.dailyChallenge.goal"
                    :aria-label="t(DASHBOARD_A11Y_KEYS.challengeProgressAria)"></progress>
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
            <h2 class="card-title text-lg mb-3">{{ t(DASHBOARD_COPY_KEYS.recentActivityTitle) }}</h2>
            <ul class="list rounded-box bg-base-100">
              <li
                v-for="(activity, index) in dashboard?.recentActivity"
                :key="`${activity.timestamp.toISOString()}-${index}`"
                class="list-row"
              >
                <div class="avatar placeholder">
                  <div class="bg-primary text-primary-content rounded-full w-10">
                    <span class="text-xs">{{ getDashboardActivityEmoji(activity.type) }}</span>
                  </div>
                </div>
                <div class="list-col-grow">
                  <p class="text-sm font-medium">{{ activity.description }}</p>
                  <p class="text-xs text-base-content/60">{{ formatTimeAgo(activity.timestamp) }}</p>
                </div>
              </li>

              <li
                v-if="(dashboard?.recentActivity.length ?? 0) === 0"
                class="list-row text-sm text-center text-base-content/60"
              >
                {{ t(DASHBOARD_COPY_KEYS.recentActivityEmptyLabel) }}
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section class="card bg-base-200">
        <div class="card-body">
          <h2 class="card-title text-lg mb-4">{{ t(DASHBOARD_COPY_KEYS.quickActionsTitle) }}</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <NuxtLink
              v-for="action in DASHBOARD_QUICK_ACTIONS"
              :key="action.id"
              :to="action.to"
              class="btn btn-outline justify-start sm:justify-center"
              :aria-label="t(action.labelKey)"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="action.iconPath" />
              </svg>
              {{ t(action.labelKey) }}
            </NuxtLink>
          </div>
        </div>
      </section>

      <WorkPipeline
        :title="t(DASHBOARD_COPY_KEYS.pipelineTitle)"
        :description="t(DASHBOARD_COPY_KEYS.pipelineDescription)"
        :aria-label="t(DASHBOARD_COPY_KEYS.pipelineAria)"
        :steps="pipelineSteps"
        :next-step-label="nextPipelineStepLabel"
      />
    </div>
  </section>
</template>

<style scoped>
.hero-text-rotate-enter-active,
.hero-text-rotate-leave-active {
  transition: all 0.18s ease;
}

.hero-text-rotate-enter-from {
  opacity: 0;
  transform: translateY(0.4rem);
}

.hero-text-rotate-leave-to {
  opacity: 0;
  transform: translateY(-0.4rem);
}
</style>
