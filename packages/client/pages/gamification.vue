<script setup lang="ts">
import { APP_BRAND, APP_ROUTES } from "@bao/shared";
import type { Achievement, DailyChallenge, UserGamificationData } from "@bao/shared";
import { getXPProgress } from "@bao/shared";
import { useI18n } from "vue-i18n";
import { settlePromise } from "~/composables/async-flow";
import {
  GAMIFICATION_ASYNC_DATA_KEY,
  GAMIFICATION_ACHIEVEMENTS_ICON,
  GAMIFICATION_DEFAULT_CHALLENGE_GOAL,
  GAMIFICATION_PROGRESS_MAX,
  GAMIFICATION_PROGRESS_MIN,
  GAMIFICATION_LOADING_SKELETON_LINES,
  GAMIFICATION_XP_TARGET_FALLBACK,
  GAMIFICATION_CURRENT_STREAK_ICON,
  GAMIFICATION_LEVEL_ICON,
  GAMIFICATION_LONGEST_STREAK_ICON,
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
const completingChallenge = ref<string | null>(null);

if (import.meta.server) {
  useServerSeoMeta({
    title: t("gamificationPage.seoTitle", { brand: APP_BRAND.name }),
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

  return {
    progress,
    achievements,
    challenges: challengePayload.challenges,
  };
}

function toEdenErrorMessage(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  const value = Reflect.get(error, "value");
  if (!value || typeof value !== "object") return undefined;
  const message = Reflect.get(value, "message");
  return typeof message === "string" ? message : undefined;
}

async function requestData<T>(
  request: Promise<{ readonly data: T; readonly error?: unknown }>,
  fallbackMessage: string,
): Promise<T> {
  const response = await request;
  if (response.error) {
    throw new Error(toEdenErrorMessage(response.error) ?? fallbackMessage);
  }
  return response.data;
}
</script>

<template>
  <section class="space-y-6" aria-labelledby="gamification-title">
    <header class="space-y-1">
      <h1 id="gamification-title" class="text-3xl font-bold">{{ t("gamificationPage.pageTitle") }}</h1>
      <p class="text-sm text-base-content/60">{{ t("gamificationPage.metricsSummary", { brand: APP_BRAND.name }) }}</p>
    </header>

    <LoadingSkeleton
      v-if="uiState === 'loading' || uiState === 'idle'"
      :lines="GAMIFICATION_LOADING_SKELETON_LINES"
    />

    <div v-else-if="uiState === 'error'" class="alert alert-error" role="alert">
      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>{{ getErrorMessage(error, t("gamificationPage.loadErrorFallback")) }}</span>
      <button
        type="button"
        class="btn btn-sm"
        :aria-label="t('gamificationPage.retryAria')"
        @click="retryPageLoad"
      >
        {{ t("gamificationPage.retryButtonLabel") }}
      </button>
    </div>

    <div v-else-if="uiState === 'empty'" class="card bg-base-200 card-border">
      <div class="card-body items-start gap-3">
        <h2 class="card-title">{{ t("gamificationPage.emptyStateTitle") }}</h2>
        <p class="text-sm text-base-content/70">{{ t("gamificationPage.emptyStateDescription") }}</p>
        <div class="card-actions">
          <NuxtLink :to="APP_ROUTES.dashboard" class="btn btn-primary">
            {{ t("gamificationPage.emptyStateCta") }}
          </NuxtLink>
        </div>
      </div>
    </div>

    <div v-else-if="hubData" class="space-y-6">
      <section class="card bg-gradient-to-br from-primary to-secondary text-primary-content">
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

      <section class="stats stats-vertical lg:stats-horizontal w-full bg-base-200">
        <div class="stat">
          <div class="stat-figure text-4xl" aria-hidden="true">{{ GAMIFICATION_CURRENT_STREAK_ICON }}</div>
          <div class="stat-title">{{ t("gamificationPage.currentStreakTitle") }}</div>
          <div class="stat-value text-primary">{{ hubData.progress.currentStreak || 0 }}</div>
          <div class="stat-desc">{{ t("gamificationPage.streakDaysSuffix") }}</div>
        </div>

        <div class="stat">
          <div class="stat-figure text-4xl" aria-hidden="true">{{ GAMIFICATION_LONGEST_STREAK_ICON }}</div>
          <div class="stat-title">{{ t("gamificationPage.longestStreakTitle") }}</div>
          <div class="stat-value text-secondary">{{ hubData.progress.longestStreak || 0 }}</div>
          <div class="stat-desc">{{ t("gamificationPage.longestStreakDesc") }}</div>
        </div>

        <div class="stat">
          <div class="stat-figure text-4xl" aria-hidden="true">{{ GAMIFICATION_ACHIEVEMENTS_ICON }}</div>
          <div class="stat-title">{{ t("gamificationPage.achievementsTitle") }}</div>
          <div class="stat-value text-accent">{{ unlockedAchievements.length }}</div>
          <div class="stat-desc">
            {{ unlockedAchievements.length }} / {{ hubData.achievements.length }}
          </div>
        </div>
      </section>

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
  </section>
</template>
