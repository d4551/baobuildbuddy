<script setup lang="ts">
import type { Achievement, DailyChallenge, UserGamificationData } from "@bao/shared";
import { APP_ROUTES, getXPProgress } from "@bao/shared";
import { useI18n } from "vue-i18n";
import { settlePromise } from "~/composables/async-flow";
import {
  GAMIFICATION_ACHIEVEMENTS_ICON,
  GAMIFICATION_ASYNC_DATA_KEY,
  GAMIFICATION_CURRENT_STREAK_ICON,
  GAMIFICATION_DEFAULT_CHALLENGE_GOAL,
  GAMIFICATION_LEVEL_ICON,
  GAMIFICATION_LOADING_SKELETON_LINES,
  GAMIFICATION_LONGEST_STREAK_ICON,
  GAMIFICATION_PROGRESS_MAX,
  GAMIFICATION_PROGRESS_MIN,
  GAMIFICATION_XP_TARGET_FALLBACK,
} from "~/constants/gamification";
import { getErrorMessage } from "~/utils/errors";

interface GamificationHubData {
  readonly progress: UserGamificationData;
  readonly achievements: readonly Achievement[];
  readonly challenges: readonly DailyChallenge[];
}

type GamificationUiState = "idle" | "loading" | "error" | "empty" | "success";

const api = useApi();
const { $toast } = useNuxtApp();
const { t } = useI18n();
const { resolvedBrand } = useBrand();
const completingChallenge = ref<string | null>(null);

if (import.meta.server) {
  useServerSeoMeta({
    title: t("gamificationPage.seoTitle", { brand: resolvedBrand.value.name }),
    description: t("gamificationPage.seoDescription"),
  });
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

const unlockedAchievements = computed(() => {
  return hubData.value?.achievements.filter((achievement) => achievement.unlocked) ?? [];
});

const lockedAchievements = computed(() => {
  return hubData.value?.achievements.filter((achievement) => !achievement.unlocked) ?? [];
});

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

function isGamificationEmpty(payload: GamificationHubData): boolean {
  return (
    payload.progress.xp === 0 &&
    payload.achievements.length === 0 &&
    payload.challenges.length === 0
  );
}

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
      await requestData(
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

async function fetchGamificationHubData(): Promise<GamificationHubData> {
  const [progress, achievements, challengePayload] = await Promise.all([
    requestData(api.gamification.progress.get(), t("gamificationPage.loadErrorFallback")),
    requestData(api.gamification.achievements.get(), t("gamificationPage.loadErrorFallback")),
    requestData(api.gamification.challenges.get(), t("gamificationPage.loadErrorFallback")),
  ]);

  if (!progress || !achievements || !challengePayload) {
    throw new Error(t("gamificationPage.loadErrorFallback"));
  }

  return {
    progress,
    achievements,
    challenges: challengePayload.challenges,
  };
}

async function requestData<T>(
  request: Promise<{ readonly data: T; readonly error?: unknown }>,
  fallbackMessage: string,
): Promise<T> {
  const response = await request;
  if (response.error) {
    throw new Error(getErrorMessage(response.error, fallbackMessage));
  }
  return response.data;
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

    <div v-else-if="hubData" class="space-y-6">
      <section class="card bg-linear-to-br from-primary to-secondary text-primary-content">
        <div class="card-body">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-4xl font-bold">
                {{ t("gamificationPage.levelPrefix") }} {{ hubData.progress.level }}
              </h2>
              <p class="opacity-80">
                {{ hubData.progress.xp }} / {{ xpTarget }} {{ t("gamificationPage.xpSuffix") }}
              </p>
            </div>
            <div class="text-6xl" aria-hidden="true">{{ GAMIFICATION_LEVEL_ICON }}</div>
          </div>

          <progress
            class="progress progress-primary-content w-full h-4"
            :value="levelProgress"
            :max="GAMIFICATION_PROGRESS_MAX"
            :aria-valuenow="levelProgress"
            :aria-valuemin="GAMIFICATION_PROGRESS_MIN"
            :aria-valuemax="GAMIFICATION_PROGRESS_MAX"
            :aria-label="t('gamificationPage.a11y.levelProgress')"
          ></progress>

          <p class="text-sm opacity-80 mt-2">
            {{ xpUntilNextLevel }} {{ t("gamificationPage.xpUntilLevelLabel") }} {{ hubData.progress.level + 1 }}
          </p>
        </div>
      </section>

      <StatsRow
        background-class="bg-base-200"
        :stats="[
          { titleKey: 'gamificationPage.currentStreakTitle', value: hubData.progress.currentStreak || 0, valueClass: 'text-primary', descKey: 'gamificationPage.streakDaysSuffix', figure: GAMIFICATION_CURRENT_STREAK_ICON },
          { titleKey: 'gamificationPage.longestStreakTitle', value: hubData.progress.longestStreak || 0, valueClass: 'text-secondary', descKey: 'gamificationPage.longestStreakDesc', figure: GAMIFICATION_LONGEST_STREAK_ICON },
          { titleKey: 'gamificationPage.achievementsTitle', value: unlockedAchievements.length, valueClass: 'text-accent', descKey: 'gamificationPage.longestStreakDesc', figure: GAMIFICATION_ACHIEVEMENTS_ICON },
        ]"
      />

      <section class="card bg-base-200">
        <div class="card-body">
          <h2 class="card-title mb-4">{{ t("gamificationPage.dailyChallengesTitle") }}</h2>

          <div class="space-y-3" v-if="hubData.challenges.length > 0">
            <article v-for="challenge in hubData.challenges" :key="challenge.id" class="card bg-base-100 card-border">
              <div class="card-body p-4">
                <div class="flex items-center justify-between mb-2">
                  <h3 class="font-semibold">{{ challenge.name }}</h3>
                  <div class="flex items-center gap-2">
                    <span class="badge badge-primary">+{{ challenge.xpReward }} {{ t("gamificationPage.xpSuffix") }}</span>
                    <span v-if="challenge.completed" class="badge badge-success">{{ t("gamificationPage.challengeDoneLabel") }}</span>
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  <span class="w-8 text-lg" aria-hidden="true">{{ challenge.icon }}</span>
                  <progress
                    class="progress flex-1"
                    :class="challenge.completed ? 'progress-success' : 'progress-primary'"
                    :value="getChallengeProgress(challenge)"
                    :max="getChallengeGoal(challenge)"
                    :aria-valuenow="getChallengeProgress(challenge)"
                    :aria-valuemin="GAMIFICATION_PROGRESS_MIN"
                    :aria-valuemax="getChallengeGoal(challenge)"
                    :aria-label="t('gamificationPage.a11y.challengeProgress')"
                  ></progress>
                  <span class="text-sm font-medium">
                    {{ getChallengeProgress(challenge) }} / {{ getChallengeGoal(challenge) }}
                  </span>
                </div>

                <div v-if="canClaimChallenge(challenge)" class="card-actions justify-end mt-2">
                  <button
                    type="button"
                    class="btn btn-success btn-sm"
                    :disabled="completingChallenge === challenge.id"
                    :aria-label="t('gamificationPage.challengeClaimAria', { challenge: challenge.name })"
                    @click="handleCompleteChallenge(challenge.id)"
                  >
                    <span
                      v-if="completingChallenge === challenge.id"
                      class="loading loading-spinner loading-xs"
                      aria-hidden="true"
                    ></span>
                    {{ t("gamificationPage.challengeClaimLabel") }}
                  </button>
                </div>
              </div>
            </article>
          </div>

          <p v-else class="text-sm text-base-content/60">{{ t("gamificationPage.noChallengesLabel") }}</p>
        </div>
      </section>

      <section class="card bg-base-200">
        <div class="card-body">
          <h2 class="card-title mb-4">{{ t("gamificationPage.achievementsTitle") }}</h2>

          <div v-if="unlockedAchievements.length" class="mb-6">
            <h3 class="font-semibold mb-3 text-success">{{ t("gamificationPage.achievementsUnlockedLabel") }}</h3>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <AchievementBadge
                v-for="achievement in unlockedAchievements"
                :key="achievement.id"
                :achievement="achievement"
                class="card bg-base-100 border-2 border-success shadow-lg"
              />
            </div>
          </div>

          <div v-if="lockedAchievements.length">
            <h3 class="font-semibold mb-3 text-base-content/60">{{ t("gamificationPage.achievementsLockedLabel") }}</h3>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <AchievementBadge
                v-for="achievement in lockedAchievements"
                :key="achievement.id"
                :achievement="achievement"
                class="card bg-base-100 opacity-60"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  </PageScaffold>
</template>
