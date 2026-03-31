<script setup lang="ts">
import type { UserGamificationData } from "@bao/shared";
import {
  GAMIFICATION_ACHIEVEMENTS_ICON,
  GAMIFICATION_CURRENT_STREAK_ICON,
  GAMIFICATION_LEVEL_ICON,
  GAMIFICATION_LONGEST_STREAK_ICON,
  GAMIFICATION_PROGRESS_MAX,
  GAMIFICATION_PROGRESS_MIN,
} from "~/constants/gamification";

defineProps<{
  progress: UserGamificationData;
  levelProgress: number;
  xpTarget: number;
  xpUntilNextLevel: number;
  unlockedAchievementsCount: number;
  t: (key: string, values?: Record<string, unknown>) => string;
}>();
</script>

<template>
  <div class="space-y-6">
    <section class="card bg-linear-to-br from-primary to-secondary text-primary-content">
      <div class="card-body">
        <div class="mb-4 flex items-center justify-between">
          <div>
            <h2 class="text-4xl font-bold">{{ t("gamificationPage.levelPrefix") }} {{ progress.level }}</h2>
            <p class="opacity-80">
              {{ progress.xp }} / {{ xpTarget }} {{ t("gamificationPage.xpSuffix") }}
            </p>
          </div>
          <div class="text-6xl" aria-hidden="true">{{ GAMIFICATION_LEVEL_ICON }}</div>
        </div>

        <progress
          class="progress progress-primary-content h-4 w-full"
          :value="levelProgress"
          :max="GAMIFICATION_PROGRESS_MAX"
          :aria-valuenow="levelProgress"
          :aria-valuemin="GAMIFICATION_PROGRESS_MIN"
          :aria-valuemax="GAMIFICATION_PROGRESS_MAX"
          :aria-label="t('gamificationPage.a11y.levelProgress')"
        ></progress>

        <p class="mt-2 text-sm opacity-80">
          {{ xpUntilNextLevel }} {{ t("gamificationPage.xpUntilLevelLabel") }} {{ progress.level + 1 }}
        </p>
      </div>
    </section>

    <StatsRow
      background-class="bg-base-200"
      :stats="[
        { titleKey: 'gamificationPage.currentStreakTitle', value: progress.currentStreak || 0, valueClass: 'text-primary', descKey: 'gamificationPage.streakDaysSuffix', figure: GAMIFICATION_CURRENT_STREAK_ICON },
        { titleKey: 'gamificationPage.longestStreakTitle', value: progress.longestStreak || 0, valueClass: 'text-secondary', descKey: 'gamificationPage.longestStreakDesc', figure: GAMIFICATION_LONGEST_STREAK_ICON },
        { titleKey: 'gamificationPage.achievementsTitle', value: unlockedAchievementsCount, valueClass: 'text-accent', descKey: 'gamificationPage.longestStreakDesc', figure: GAMIFICATION_ACHIEVEMENTS_ICON },
      ]"
    />
  </div>
</template>
