import { getXPProgress } from "@bao/shared/constants/xp-levels";
import { formatRelativeTime } from "@bao/shared/utils/date-helpers";
import { useI18n } from "vue-i18n";
import { createFlowEngineInput } from "~/constants/flow-engine";
import {
  DASHBOARD_A11Y_KEYS,
  DASHBOARD_COPY_KEYS,
  DASHBOARD_MOTIVATIONAL_PHRASE_KEYS,
  DASHBOARD_PIPELINE_STATUS_KEYS,
  DASHBOARD_WELCOME_HEADING_KEYS,
} from "~/constants/dashboard-copy";
import {
  DASHBOARD_ASYNC_DATA_KEY,
  DASHBOARD_STAT_CARDS,
  DASHBOARD_TIME_CONSTANTS,
} from "~/constants/dashboard-core";
import type {
  DashboardPipelineStepViewModel,
  DashboardStatKey,
} from "~/constants/dashboard-contracts";
import { resolveDashboardPipelineSteps } from "~/constants/dashboard-pipeline";
import { GAMIFICATION_XP_TARGET_FALLBACK } from "~/constants/gamification";
import type {
  DashboardStatCardViewModel,
  DashboardUiState,
} from "~/components/dashboard/dashboard-page-contracts";
import { fetchDashboardViewModel, isDashboardEmpty, toFlowStats } from "./dashboard-page-data";
import { getErrorMessage } from "~/utils/errors";

type DashboardAsyncState = Awaited<ReturnType<typeof useDashboardAsyncState>>;
type DashboardRef = DashboardAsyncState["dashboard"];

const useDashboardAsyncState = async (
  api: ReturnType<typeof useApi>,
  t: ReturnType<typeof useI18n>["t"],
) => {
  const { data, error, refresh, status } = await useAsyncData(
    DASHBOARD_ASYNC_DATA_KEY,
    () => fetchDashboardViewModel(api, t),
    { lazy: false, server: true },
  );
  const dashboard = computed(() => data.value ?? null);
  const uiState = computed<DashboardUiState>(() => {
    if (status.value === "pending") return "loading";
    if (status.value === "error") return "error";
    if (status.value === "idle") return "idle";
    return !dashboard.value || isDashboardEmpty(dashboard.value) ? "empty" : "success";
  });

  return { dashboard, error, refresh, uiState };
};

const useDashboardHeroPhrase = (t: ReturnType<typeof useI18n>["t"]) => {
  const heroPhraseIndex = ref(0);
  const activeHeroPhrase = computed(() => {
    const phraseKey =
      DASHBOARD_MOTIVATIONAL_PHRASE_KEYS[
        heroPhraseIndex.value % DASHBOARD_MOTIVATIONAL_PHRASE_KEYS.length
      ];
    return t(phraseKey ?? DASHBOARD_MOTIVATIONAL_PHRASE_KEYS[0]);
  });

  let heroPhraseTimer: ReturnType<typeof setInterval> | null = null;
  onMounted(() => {
    heroPhraseTimer = setInterval(() => {
      heroPhraseIndex.value += 1;
    }, DASHBOARD_TIME_CONSTANTS.heroTextRotateIntervalMs);
  });
  onUnmounted(() => {
    if (!heroPhraseTimer) return;
    clearInterval(heroPhraseTimer);
    heroPhraseTimer = null;
  });

  return activeHeroPhrase;
};

const useDashboardWelcomeHeading = (t: ReturnType<typeof useI18n>["t"], dashboard: DashboardRef) =>
  computed(() => {
    const profileName = dashboard.value?.profile?.name?.trim();
    return profileName
      ? t(DASHBOARD_WELCOME_HEADING_KEYS.named, { name: profileName })
      : t(DASHBOARD_WELCOME_HEADING_KEYS.fallback);
  });

const useDashboardProgress = (dashboard: DashboardRef) => ({
  levelProgress: computed(() => {
    const gamification = dashboard.value?.gamification;
    return gamification ? Math.round(getXPProgress(gamification.xp).progress * 100) : 0;
  }),
  xpTarget: computed(() => {
    const gamification = dashboard.value?.gamification;
    if (!gamification) return GAMIFICATION_XP_TARGET_FALLBACK;
    const { nextLevel } = getXPProgress(gamification.xp);
    return nextLevel ? nextLevel.minXP : gamification.xp;
  }),
});

const useDashboardPipeline = (t: ReturnType<typeof useI18n>["t"], dashboard: DashboardRef) => {
  const pipelineSteps = computed<readonly DashboardPipelineStepViewModel[]>(() => {
    const metrics = dashboard.value?.metrics;
    return resolveDashboardPipelineSteps({
      savedJobs: metrics?.savedJobs ?? 0,
      appliedJobs: metrics?.appliedJobs ?? 0,
      resumeCount: metrics?.resumeCount ?? 0,
      coverLetterCount: metrics?.coverLetterCount ?? 0,
      automationRuns: metrics?.automationRuns ?? 0,
      successfulAutomationRuns: metrics?.successfulAutomationRuns ?? 0,
      mappedSkillsCount: metrics?.mappedSkillsCount ?? 0,
      gamificationXp: dashboard.value?.gamification?.xp ?? 0,
    });
  });

  return {
    nextPipelineStepLabel: computed(() => {
      const nextStep = pipelineSteps.value.find((step) => step.status !== "complete");
      return nextStep
        ? t(DASHBOARD_COPY_KEYS.pipelineNextStepLabel, { step: t(nextStep.labelKey) })
        : t(DASHBOARD_PIPELINE_STATUS_KEYS.complete);
    }),
    pipelineSteps,
  };
};

const useDashboardFlowActions = (t: ReturnType<typeof useI18n>["t"], dashboard: DashboardRef) => {
  const flowInput = computed(() =>
    createFlowEngineInput(dashboard.value ? toFlowStats(dashboard.value) : null),
  );
  const { nextStepLabel, primaryAction, recommendedActions } = useFlowEngine(flowInput);

  return {
    dashboardQuickActions: computed(() =>
      [primaryAction.value, ...recommendedActions.value].slice(0, 4),
    ),
    primaryFlowLabel: computed(() => t(nextStepLabel.value)),
    primaryFlowRoute: computed(() => primaryAction.value.to),
  };
};

const getDashboardMetricValue = (dashboard: DashboardRef, statKey: DashboardStatKey): number => {
  const metrics = dashboard.value?.metrics;
  if (!metrics) return 0;
  if (statKey === "savedJobs") return metrics.savedJobs;
  if (statKey === "resumeCount") return metrics.resumeCount;
  return metrics.interviewSessionCount;
};

const useDashboardStatCards = (t: ReturnType<typeof useI18n>["t"], dashboard: DashboardRef) =>
  computed<readonly DashboardStatCardViewModel[]>(() =>
    DASHBOARD_STAT_CARDS.map((statCard) => {
      const value = getDashboardMetricValue(dashboard, statCard.statKey);
      const title = t(statCard.titleKey);
      const ctaLabel = t(statCard.ctaLabelKey);
      return {
        id: statCard.id,
        title,
        to: statCard.to,
        value,
        iconPath: statCard.iconPath,
        accentClass: statCard.accentClass,
        ctaLabel,
        ariaLabel: t(DASHBOARD_A11Y_KEYS.statCardAria, { cta: ctaLabel, title, value }),
      };
    }),
  );

const useDashboardErrorToast = (
  error: DashboardAsyncState["error"],
  t: ReturnType<typeof useI18n>["t"],
  toast: ReturnType<typeof useNuxtApp>["$toast"],
) => {
  watch(error, (nextError) => {
    if (import.meta.client && nextError) {
      toast.error(getErrorMessage(nextError, t(DASHBOARD_COPY_KEYS.loadErrorFallback)));
    }
  });
};

export async function useDashboardPage() {
  const api = useApi();
  const { $toast } = useNuxtApp();
  const { t } = useI18n();
  const { resolvedBrand } = useBrand();
  const activeHeroPhrase = useDashboardHeroPhrase(t);
  const { dashboard, error, refresh, uiState } = await useDashboardAsyncState(api, t);
  const welcomeHeading = useDashboardWelcomeHeading(t, dashboard);
  const { levelProgress, xpTarget } = useDashboardProgress(dashboard);
  const { nextPipelineStepLabel, pipelineSteps } = useDashboardPipeline(t, dashboard);
  const { dashboardQuickActions, primaryFlowLabel, primaryFlowRoute } = useDashboardFlowActions(
    t,
    dashboard,
  );
  const statCards = useDashboardStatCards(t, dashboard);
  useDashboardErrorToast(error, t, $toast);

  return {
    resolvedBrand,
    dashboard,
    error,
    uiState,
    welcomeHeading,
    activeHeroPhrase,
    levelProgress,
    xpTarget,
    pipelineSteps,
    nextPipelineStepLabel,
    primaryFlowRoute,
    primaryFlowLabel,
    dashboardQuickActions,
    statCards,
    retryDashboardLoad: async () => refresh(),
    formatTimeAgo: (timestamp: Date) =>
      formatRelativeTime(timestamp, (key, params) => t(key, params ?? {}), {
        keyPrefix: "dashboard.relativeTime",
        minOneUnit: true,
        daysOnly: true,
      }),
  };
}

export type DashboardPageState = Awaited<ReturnType<typeof useDashboardPage>>;
