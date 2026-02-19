<script setup lang="ts">
import type { Achievement } from "@navi/shared";
import { getErrorMessage } from "~/utils/errors";

const { $toast } = useNuxtApp();
const {
  progress,
  achievements,
  challenges,
  loading,
  fetchProgress,
  fetchAchievements,
  fetchChallenges,
  completeChallenge,
  level,
  xpToNextLevel,
} = useGamification();

const pageError = ref<string | null>(null);
const completingChallenge = ref<string | null>(null);

const gamification = computed(() => {
  if (!progress.value) return null;

  return {
    xp: progress.value.xp || 0,
    level: level.value || 1,
    xpToNextLevel: xpToNextLevel.value || 0,
    xpForNextLevel: progress.value.xpForNextLevel || 0,
    currentStreak: progress.value.currentStreak || 0,
    longestStreak: progress.value.longestStreak || 0,
    achievements: achievements.value || [],
    dailyChallenges: challenges.value || [],
  };
});

onMounted(async () => {
  await fetchData();
});

async function fetchData() {
  pageError.value = null;
  try {
    await Promise.all([fetchProgress(), fetchAchievements(), fetchChallenges()]);
  } catch (error: unknown) {
    pageError.value = getErrorMessage(error, "Failed to load gamification data");
    $toast.error(pageError.value);
  }
}

async function handleCompleteChallenge(challengeId: string) {
  completingChallenge.value = challengeId;
  try {
    await completeChallenge(challengeId);
    await fetchChallenges();
    $toast.success("Challenge completed!");
  } catch (error: unknown) {
    $toast.error(getErrorMessage(error, "Failed to complete challenge"));
  } finally {
    completingChallenge.value = null;
  }
}

const unlockedAchievements = computed(() => {
  return gamification.value?.achievements?.filter((a: Achievement) => a.unlocked) || [];
});

const lockedAchievements = computed(() => {
  return gamification.value?.achievements?.filter((a: Achievement) => !a.unlocked) || [];
});

const levelProgress = computed(() => {
  if (!gamification.value) return 0;
  return (gamification.value.xp / gamification.value.xpForNextLevel) * 100;
});
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">Gamification Hub</h1>

    <div v-if="pageError" class="alert alert-error mb-6">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{{ pageError }}</span>
      <button class="btn btn-sm" @click="fetchData">Retry</button>
    </div>

    <LoadingSkeleton v-else-if="loading && !gamification" :lines="8" />

    <div v-else-if="gamification" class="space-y-6">
      <!-- Level & XP -->
      <div class="card bg-gradient-to-br from-primary to-secondary text-primary-content">
        <div class="card-body">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-4xl font-bold">Level {{ gamification.level }}</h2>
              <p class="opacity-80">{{ gamification.xp }} / {{ gamification.xpForNextLevel }} XP</p>
            </div>
            <div class="text-6xl">🎮</div>
          </div>

          <progress
            class="progress progress-primary-content w-full h-4"
            :value="levelProgress"
            max="100"
          ></progress>

          <p class="text-sm opacity-80 mt-2">
            {{ gamification.xpToNextLevel }} XP until level {{ gamification.level + 1 }}
          </p>
        </div>
      </div>

      <!-- Streak -->
      <div class="stats stats-vertical lg:stats-horizontal w-full bg-base-200">
        <div class="stat">
          <div class="stat-figure text-4xl">🔥</div>
          <div class="stat-title">Current Streak</div>
          <div class="stat-value text-primary">{{ gamification.currentStreak }}</div>
          <div class="stat-desc">days in a row</div>
        </div>

        <div class="stat">
          <div class="stat-figure text-4xl">⭐</div>
          <div class="stat-title">Longest Streak</div>
          <div class="stat-value text-secondary">{{ gamification.longestStreak }}</div>
          <div class="stat-desc">personal best</div>
        </div>

        <div class="stat">
          <div class="stat-figure text-4xl">🏆</div>
          <div class="stat-title">Achievements</div>
          <div class="stat-value text-accent">{{ unlockedAchievements.length }}</div>
          <div class="stat-desc">of {{ gamification.achievements.length }} unlocked</div>
        </div>
      </div>

      <!-- Daily Challenges -->
      <div class="card bg-base-200">
        <div class="card-body">
          <h2 class="card-title mb-4">Daily Challenges</h2>

          <div class="space-y-3">
            <div
              v-for="challenge in gamification.dailyChallenges"
              :key="challenge.id"
              class="card bg-base-100"
            >
              <div class="card-body p-4">
                <div class="flex items-center justify-between mb-2">
                  <h3 class="font-semibold">{{ challenge.title }}</h3>
                  <div class="flex items-center gap-2">
                    <span class="badge badge-primary">+{{ challenge.xp }} XP</span>
                    <span v-if="challenge.completed" class="badge badge-success">✓ Done</span>
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  <progress
                    class="progress flex-1"
                    :class="challenge.completed ? 'progress-success' : 'progress-primary'"
                    :value="challenge.progress"
                    :max="challenge.goal"
                  ></progress>
                  <span class="text-sm font-medium">
                    {{ challenge.progress }} / {{ challenge.goal }}
                  </span>
                </div>

                <div v-if="!challenge.completed && challenge.progress >= challenge.goal" class="card-actions justify-end mt-2">
                  <button
                    class="btn btn-success btn-sm"
                    :disabled="completingChallenge === challenge.id"
                    @click="handleCompleteChallenge(challenge.id)"
                  >
                    <span v-if="completingChallenge === challenge.id" class="loading loading-spinner loading-xs"></span>
                    Claim Reward
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Achievements -->
      <div class="card bg-base-200">
        <div class="card-body">
          <h2 class="card-title mb-4">Achievements</h2>

          <!-- Unlocked -->
          <div v-if="unlockedAchievements.length" class="mb-6">
            <h3 class="font-semibold mb-3 text-success">Unlocked</h3>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div
                v-for="achievement in unlockedAchievements"
                :key="achievement.id"
                class="card bg-base-100 border-2 border-success shadow-lg"
              >
                <div class="card-body p-4 text-center">
                  <div class="text-4xl mb-2">{{ achievement.icon }}</div>
                  <h4 class="font-bold text-sm">{{ achievement.name }}</h4>
                  <p class="text-xs text-base-content/60">{{ achievement.description }}</p>
                  <div class="badge badge-success badge-sm mt-2">+{{ achievement.xp }} XP</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Locked -->
          <div v-if="lockedAchievements.length">
            <h3 class="font-semibold mb-3 text-base-content/60">Locked</h3>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div
                v-for="achievement in lockedAchievements"
                :key="achievement.id"
                class="card bg-base-100 opacity-50"
              >
                <div class="card-body p-4 text-center">
                  <div class="text-4xl mb-2 grayscale">{{ achievement.icon }}</div>
                  <h4 class="font-bold text-sm">{{ achievement.name }}</h4>
                  <p class="text-xs text-base-content/60">{{ achievement.description }}</p>
                  <div class="badge badge-ghost badge-sm mt-2">+{{ achievement.xp }} XP</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
