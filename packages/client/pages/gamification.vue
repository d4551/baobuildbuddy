<script setup lang="ts">
import { STACK_SPACE_Y_TOKEN_CLASS } from "~/constants/layout";

definePageMeta({
  middleware: ["auth"],
});

import { APP_ROUTES } from "@bao/shared/constants/routes";
import { getXPProgress } from "@bao/shared/constants/xp-levels";
import type { DailyChallenge } from "@bao/shared/types/gamification";
import { useI18n } from "vue-i18n";
import { settlePromise } from "~/composables/async-flow";
import {
  fetchOptionalTrend,
  type GamificationHubData,
  isGamificationEmpty,
  requestGamificationData,
  toMonthlyTrend,
  toWeeklyTrend,
} from "~/composables/gamification-hub-data";
import {
  GAMIFICATION_ASYNC_DATA_KEY,
  GAMIFICATION_DEFAULT_CHALLENGE_GOAL,
  GAMIFICATION_LOADING_SKELETON_LINES,
  GAMIFICATION_XP_TARGET_FALLBACK,
} from "~/constants/gamification";
import { getErrorMessage } from "~/utils/errors";

type GamificationUiState = "idle" | "loading" | "error" | "empty" | "success";

const api = useApi();
const { $toast } = useNuxtApp();
const { t } = useI18n();
const { resolvedBrand } = useBrand();
const completingChallenge = ref<string | null>(null);

useSeoMeta({
  title: t("gamificationPage.seoTitle", { brand: resolvedBrand.value.name }),
  description: t("gamificationPage.seoDescription"),
});

async function fetchGamificationHubData(): Promise<GamificationHubData> {
  const fallback = t("gamificationPage.loadErrorFallback");
  const [progress, achievements, challengePayload, weeklyRaw, monthlyRaw] = await Promise.all([
    requestGamificationData(api.gamification.progress.get(), fallback),
    requestGamificationData(api.gamification.achievements.get(), fallback),
    requestGamificationData(api.gamification.challenges.get(), fallback),
    fetchOptionalTrend(api.gamification.weekly.get()),
    fetchOptionalTrend(api.gamification.monthly.get()),
  ]);

  if (!progress || !achievements || !challengePayload) {
    throw new Error(fallback);
  }

  return {
    progress,
    achievements,
    challenges: challengePayload.challenges,
    weekly: toWeeklyTrend(weeklyRaw),
    monthly: toMonthlyTrend(monthlyRaw),
  };
}

const { data, status, error, refresh } = await useAsyncData<GamificationHubData>(
  GAMIFICATION_ASYNC_DATA_KEY,
  fetchGamificationHubData,
  {
    lazy: false,
    server: true,
  },
);

const hubData = computed(() => data.value ?? null);

const uiState = computed<GamificationUiState>(() => {
  if (status.value === "pending") return "loading";
  if (status.value === "error") return "error";
  if (status.value === "idle") return "idle";
  if (!hubData.value || isGamificationEmpty(hubData.value)) return "empty";
  return "success";
});

const unlockedAchievements = computed(
  () => hubData.value?.achievements.filter((achievement) => achievement.unlocked) ?? [],
);
const lockedAchievements = computed(
  () => hubData.value?.achievements.filter((achievement) => !achievement.unlocked) ?? [],
);

const levelProgress = computed(() => {
  const progress = hubData.value?.progress;
  if (!progress) return 0;
  return Math.round(getXPProgress(progress.xp).progress * 100);
});

const xpTarget = computed(() => {
  const progress = hubData.value?.progress;
  if (!progress) return GAMIFICATION_XP_TARGET_FALLBACK;
  const { nextLevel } = getXPProgress(progress.xp);
  return nextLevel ? nextLevel.minXP : progress.xp;
});

const xpUntilNextLevel = computed(() => {
  const progress = hubData.value?.progress;
  if (!progress) return 0;
  const { nextLevel } = getXPProgress(progress.xp);
  if (!nextLevel) return 0;
  return Math.max(0, nextLevel.minXP - progress.xp);
});

watch(error, (nextError) => {
  if (import.meta.client && nextError) {
    $toast.error(getErrorMessage(nextError, t("gamificationPage.loadErrorFallback")));
  }
});

function getChallengeGoal(challenge: DailyChallenge): number {
  if (typeof challenge.goal === "number" && challenge.goal > 0) {
    return challenge.goal;
  }
  return GAMIFICATION_DEFAULT_CHALLENGE_GOAL;
}

function getChallengeProgress(challenge: DailyChallenge): number {
  if (typeof challenge.progress === "number") {
    return challenge.progress;
  }
  return challenge.completed ? getChallengeGoal(challenge) : 0;
}

function canClaimChallenge(challenge: DailyChallenge): boolean {
  return !challenge.completed && getChallengeProgress(challenge) >= getChallengeGoal(challenge);
}

async function retryPageLoad() {
  await refresh();
}

async function handleCompleteChallenge(challengeId: string) {
  completingChallenge.value = challengeId;
  const completionResult = await settlePromise(
    (async () => {
      await requestGamificationData(
        api.gamification.challenges({ id: challengeId }).complete.post(),
        t("gamificationPage.challengeCompleteErrorFallback"),
      );
      await retryPageLoad();
    })(),
    t("gamificationPage.challengeCompleteErrorFallback"),
  );
  completingChallenge.value = null;

  if (!completionResult.ok) {
    $toast.error(
      getErrorMessage(completionResult.error, t("gamificationPage.challengeCompleteErrorFallback")),
    );
    return;
  }

  $toast.success(t("gamificationPage.challengeCompletionToast"));
}
</script>

<template>
  <PageScaffold
    tag="section"
    width-token="content"
    spacing-token="comfortable"
    labelled-by="gamification-title"
  >
    <PageHeroHeader
      title-id="gamification-title"
      :title="t('gamificationPage.pageTitle')"
      :description="t('gamificationPage.metricsSummary', { brand: resolvedBrand.name })"
    />

    <LoadingSkeleton
      v-if="uiState === 'loading' || uiState === 'idle'"
      :lines="GAMIFICATION_LOADING_SKELETON_LINES"
    />

    <BootstrapErrorAlert
      v-else-if="uiState === 'error'"
      :title="t('gamificationPage.pageTitle')"
      :message="getErrorMessage(error, t('gamificationPage.loadErrorFallback'))"
      :retry-label="t('gamificationPage.retryButtonLabel')"
      :retry-aria-label="t('gamificationPage.retryAria')"
      @retry="retryPageLoad"
    />

    <EmptyState
      v-else-if="uiState === 'empty'"
      title-key="gamificationPage.emptyStateTitle"
      description-key="gamificationPage.emptyStateDescription"
      cta-label-key="gamificationPage.emptyStateCta"
      :cta-to="APP_ROUTES.dashboard"
    />

    <div v-else-if="hubData" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack6]">
      <GamificationSummaryCard
        :progress="hubData.progress"
        :level-progress="levelProgress"
        :xp-target="xpTarget"
        :xp-until-next-level="xpUntilNextLevel"
        :unlocked-achievements-count="unlockedAchievements.length"
      />

      <GamificationChallengesCard
        :challenges="hubData.challenges"
        :completing-challenge="completingChallenge"
        :t="t"
        :get-challenge-goal="getChallengeGoal"
        :get-challenge-progress="getChallengeProgress"
        :can-claim-challenge="canClaimChallenge"
        @claim="handleCompleteChallenge"
      />

      <GamificationTrendsCard
        :weekly="hubData.weekly"
        :monthly="hubData.monthly"
      />

      <GamificationAchievementsCard
        :unlocked-achievements="unlockedAchievements"
        :locked-achievements="lockedAchievements"
      />
    </div>
  </PageScaffold>
</template>
