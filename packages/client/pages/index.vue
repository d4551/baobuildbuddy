<script setup lang="ts">
import type {
  DailyChallenge,
  DashboardStats,
  UserGamificationData,
  UserProfile,
} from "@bao/shared";
import { APP_ROUTES, formatRelativeTime, getXPProgress } from "@bao/shared";
import { useI18n } from "vue-i18n";
import {
  DASHBOARD_A11Y_KEYS,
  DASHBOARD_ACTIVITY_FALLBACK_KEY,
  DASHBOARD_ASYNC_DATA_KEY,
  DASHBOARD_COPY_KEYS,
  DASHBOARD_DAILY_CHALLENGE_XP_LABEL_KEY,
  DASHBOARD_ERROR_KEYS,
  DASHBOARD_GAMIFICATION_PROGRESS_MAX,
  DASHBOARD_GAMIFICATION_PROGRESS_MIN,
  DASHBOARD_MOTIVATIONAL_PHRASE_KEYS,
  DASHBOARD_ONBOARDING_STEPS,
  DASHBOARD_PIPELINE_STATUS_KEYS,
  DASHBOARD_RECENT_ACTIVITY_LIMIT,
  DASHBOARD_STAT_CARDS,
  DASHBOARD_TIME_CONSTANTS,
  DASHBOARD_WELCOME_HEADING_KEYS,
  type DashboardPipelineStepViewModel,
  type DashboardStatKey,
  getDashboardActivityEmoji,
  getDashboardGamificationDialStyle,
  resolveDashboardPipelineSteps,
} from "~/constants/dashboard";
import { createFlowEngineInput } from "~/constants/flow-engine";
import {
  GAMIFICATION_CURRENT_STREAK_ICON,
  GAMIFICATION_LEVEL_ICON,
  GAMIFICATION_XP_TARGET_FALLBACK,
} from "~/constants/gamification";
import { requireValue } from "~/composables/async-flow";
import { toUserProfile } from "~/composables/api-normalizers";
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
  readonly profileCompleteness: number;
  readonly savedJobs: number;
  readonly appliedJobs: number;
  readonly resumeCount: number;
  readonly coverLetterCount: number;
  readonly portfolioProjectCount: number;
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

type EdenResponse = {
  readonly data?: unknown;
  readonly error?: unknown;
};

type DashboardUiState = "idle" | "loading" | "error" | "empty" | "success";

const api = useApi();
const { $toast } = useNuxtApp();
const { t } = useI18n();
const { resolvedBrand } = useBrand();

if (import.meta.server) {
  useServerSeoMeta({
    title: t(DASHBOARD_COPY_KEYS.pageTitle),
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
  return t(phraseKey ?? DASHBOARD_MOTIVATIONAL_PHRASE_KEYS[0]);
});
let heroPhraseTimer: ReturnType<typeof setInterval> | null = null;

const levelProgress = computed(() => {
  const gamification = dashboard.value?.gamification;
  if (!gamification) return 0;
  return Math.round(getXPProgress(gamification.xp).progress * 100);
});

const xpTarget = computed(() => {
  const gamification = dashboard.value?.gamification;
  if (!gamification) return GAMIFICATION_XP_TARGET_FALLBACK;
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

const flowInput = computed(() =>
  createFlowEngineInput(dashboard.value ? toFlowStats(dashboard.value) : null),
);

const {
  primaryAction: flowPrimaryAction,
  recommendedActions: flowRecommendedActions,
  nextStepLabel: flowNextStepLabel,
} = useFlowEngine(flowInput);
const primaryFlowRoute = computed(() => flowPrimaryAction.value.to);
const primaryFlowLabel = computed(() => t(flowNextStepLabel.value));
const dashboardQuickActions = computed(() =>
  [flowPrimaryAction.value, ...flowRecommendedActions.value].slice(0, 4),
);

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
  if (!currentChallenge) return null;
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
  const statsValue: unknown = progress?.stats;
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

function formatTimeAgo(timestamp: Date): string {
  return formatRelativeTime(timestamp, (key, params) => t(key, params ?? {}), {
    keyPrefix: "dashboard.relativeTime",
    minOneUnit: true,
    daysOnly: true,
  });
}

async function fetchDashboardViewModel(): Promise<DashboardViewModel> {
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
    recentActivity: getRecentActivity(gamification),
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

function toFlowStats(viewModel: DashboardViewModel): DashboardStats {
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
    ai: {
      chatMessages: 0,
      chatSessions: 0,
    },
    gamification: {
      level: viewModel.gamification?.level ?? 0,
      xp: viewModel.gamification?.xp ?? 0,
      achievements: viewModel.gamification?.achievements.length ?? 0,
      streak: viewModel.gamification?.currentStreak ?? 0,
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

async function requestData<T>(request: Promise<EdenResponse>, fallbackMessage: string): Promise<T> {
  const response = await request;
  if (response.error) {
    throw new Error(getErrorMessage(response.error, fallbackMessage));
  }
  if (response.data == null) {
    throw new Error(fallbackMessage);
  }
  return response.data as T;
}
</script>

<template>
  <PageScaffold tag="section" labelled-by="dashboard-title">
    <PageHeaderBlock
      title-id="dashboard-title"
      :title="t(DASHBOARD_COPY_KEYS.pageTitle)"
      :description="t(DASHBOARD_COPY_KEYS.metricsSummaryLabel, { brand: resolvedBrand.name })"
      description-class="text-sm text-base-content/60"
    />

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
        class="btn btn-sm btn-ghost"
        :aria-label="t(DASHBOARD_COPY_KEYS.retryAria)"
        @click="retryDashboardLoad"
      >
        {{ t(DASHBOARD_COPY_KEYS.retryButtonLabel) }}
      </button>
    </div>

    <section
      v-else-if="uiState === 'empty'"
      class="hero overflow-hidden rounded-box border border-base-300 bg-gradient-to-br from-base-100 via-base-100 to-primary/10 shadow-sm"
    >
      <div class="hero-content w-full max-w-none px-0">
        <div class="card w-full bg-base-100/90 backdrop-blur">
          <div class="card-body gap-5 p-6 lg:p-8">
            <div class="space-y-2">
              <div class="badge badge-primary badge-outline w-fit">{{ t(DASHBOARD_COPY_KEYS.pageTitle) }}</div>
              <h2 class="card-title text-2xl">{{ t(DASHBOARD_COPY_KEYS.emptyStateTitle) }}</h2>
              <p class="text-sm text-base-content/70">
                {{ t(DASHBOARD_COPY_KEYS.emptyStateDescription) }}
              </p>
            </div>

            <div class="space-y-3">
              <h3 class="text-sm font-semibold">{{ t(DASHBOARD_COPY_KEYS.onboardingChecklistTitle) }}</h3>
              <ul class="steps steps-vertical w-full lg:steps-horizontal">
                <li v-for="step in DASHBOARD_ONBOARDING_STEPS" :key="step.id" class="step step-primary">
                  <NuxtLink :to="step.to" class="link link-hover">
                    {{ t(step.labelKey) }}
                  </NuxtLink>
                </li>
              </ul>
            </div>

            <div class="card-actions flex-wrap">
              <NuxtLink :to="primaryFlowRoute" class="btn btn-primary">
                {{ primaryFlowLabel }}
              </NuxtLink>
              <NuxtLink :to="APP_ROUTES.jobs" class="btn btn-soft btn-primary">
                {{ t("dashboard.quickActions.actions.browseJobs") }}
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div v-else class="space-y-6">
      <section class="card card-border overflow-hidden bg-base-100 shadow-sm">
        <div class="card-body relative gap-4 bg-gradient-to-br from-primary/12 via-base-100 to-secondary/12">
          <div class="absolute right-0 top-0 h-32 w-32 rounded-full bg-primary/10 blur-3xl" aria-hidden="true"></div>
          <div class="absolute bottom-0 left-0 h-28 w-28 rounded-full bg-secondary/10 blur-3xl" aria-hidden="true"></div>
          <div class="relative space-y-3">
            <div class="badge badge-primary badge-soft w-fit">{{ t(DASHBOARD_COPY_KEYS.pipelineTitle) }}</div>
            <h2 class="card-title text-2xl md:text-3xl">{{ welcomeHeading }}</h2>
            <p class="text-base text-base-content/70">{{ t(DASHBOARD_COPY_KEYS.welcomeDescription) }}</p>
            <div class="badge badge-outline badge-lg text-rotate w-fit bg-base-100/70">
              <Transition name="hero-text-rotate" mode="out-in">
                <span :key="activeHeroPhrase">{{ activeHeroPhrase }}</span>
              </Transition>
            </div>
          </div>
          <div v-if="!dashboard?.profile?.name" class="card-actions relative mt-1 flex-wrap">
            <NuxtLink :to="primaryFlowRoute" class="btn btn-primary">
              {{ primaryFlowLabel }}
            </NuxtLink>
            <NuxtLink :to="APP_ROUTES.setup" class="btn btn-ghost">
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
                <span class="text-2xl" aria-hidden="true">{{ GAMIFICATION_LEVEL_ICON }}</span>
                <div>
                  <p class="text-sm text-base-content/60">
                    {{ t(DASHBOARD_COPY_KEYS.levelLabel) }} {{ dashboard.gamification.level }}
                  </p>
                  <p class="font-bold">
                    {{
                      t("xpBar.progressLabel", {
                        xp: dashboard.gamification.xp,
                        xpForNextLevel: xpTarget,
                      })
                    }}
                  </p>
                </div>
              </div>
              <progress
                class="progress progress-primary w-full"
                :value="levelProgress"
                :max="DASHBOARD_GAMIFICATION_PROGRESS_MAX"
                :aria-valuenow="levelProgress"
                :aria-valuemin="DASHBOARD_GAMIFICATION_PROGRESS_MIN"
                :aria-valuemax="DASHBOARD_GAMIFICATION_PROGRESS_MAX"
                :aria-label="t(DASHBOARD_A11Y_KEYS.levelProgressAria)"
              ></progress>
            </div>

            <div class="flex items-center gap-6">
              <div
                class="radial-progress text-primary"
                :style="getDashboardGamificationDialStyle(levelProgress)"
                role="progressbar"
                :aria-valuenow="levelProgress"
                :aria-valuemin="DASHBOARD_GAMIFICATION_PROGRESS_MIN"
                :aria-valuemax="DASHBOARD_GAMIFICATION_PROGRESS_MAX"
                :aria-label="t(DASHBOARD_A11Y_KEYS.levelProgressAria)"
              >
                <span class="text-sm font-bold">{{ levelProgress }}%</span>
              </div>

              <div v-if="dashboard.gamification.currentStreak" class="text-center">
                <div class="text-3xl" aria-hidden="true">{{ GAMIFICATION_CURRENT_STREAK_ICON }}</div>
                <p class="text-2xl font-bold">{{ dashboard.gamification.currentStreak }}</p>
                <p class="text-xs text-base-content/60">{{ t(DASHBOARD_COPY_KEYS.streakLabel) }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SectionGrid grid-token="bento">
        <NuxtLink
          v-for="statCard in DASHBOARD_STAT_CARDS"
          :key="statCard.id"
          :to="statCard.to"
          class="card bg-base-100 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md h-full"
          :aria-label="t(DASHBOARD_A11Y_KEYS.statCardAria, { title: t(statCard.titleKey), value: getMetricValue(statCard.statKey), cta: t(statCard.ctaLabelKey) })"
        >
          <div class="card-body p-5 md:p-6 flex flex-col justify-between">
            <div class="flex items-start justify-between mb-4">
              <div>
                <div class="text-sm font-medium text-base-content/60 mb-1">{{ t(statCard.titleKey) }}</div>
                <div class="text-3xl font-bold">{{ getMetricValue(statCard.statKey) }}</div>
              </div>
              <div class="p-3 rounded-2xl bg-base-200/50" :class="statCard.accentClass">
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="statCard.iconPath" />
                </svg>
              </div>
            </div>
            <div class="mt-auto flex items-center gap-1 text-xs font-semibold" :class="statCard.accentClass">
              <span>{{ t(statCard.ctaLabelKey) }}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </div>
          </div>
        </NuxtLink>
      </SectionGrid>

      <SectionGrid grid-token="twoColumnWide">
        <div v-if="dashboard?.dailyChallenge" class="card bg-base-200 h-full">
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
                    :aria-valuenow="dashboard.dailyChallenge.progress"
                    :aria-valuemin="DASHBOARD_GAMIFICATION_PROGRESS_MIN"
                    :aria-valuemax="dashboard.dailyChallenge.goal"
                    :aria-label="t(DASHBOARD_A11Y_KEYS.challengeProgressAria)"
                  ></progress>
                  <span class="text-sm font-medium">
                    {{ dashboard.dailyChallenge.progress }} / {{ dashboard.dailyChallenge.goal }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card bg-base-200 h-full">
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
      </SectionGrid>

      <section class="card bg-base-200">
        <div class="card-body">
          <h2 class="card-title text-lg mb-4">{{ t(DASHBOARD_COPY_KEYS.quickActionsTitle) }}</h2>
          <SectionGrid grid-token="bento">
            <NuxtLink
              v-for="action in dashboardQuickActions"
              :key="action.id"
              :to="action.to"
              class="btn btn-soft btn-primary justify-start border-primary/20 bg-primary/5 text-primary hover:border-primary sm:justify-center"
              :aria-label="t(action.labelKey)"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="action.iconPath" />
              </svg>
              {{ t(action.labelKey) }}
            </NuxtLink>
          </SectionGrid>
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
  </PageScaffold>
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
