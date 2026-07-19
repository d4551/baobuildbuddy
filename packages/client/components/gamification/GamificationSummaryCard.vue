<script setup lang="ts">
import type { UserGamificationData } from "@bao/shared/types/gamification";
import { useI18n } from "vue-i18n";
import {
  GAMIFICATION_ACHIEVEMENTS_ICON,
  GAMIFICATION_CURRENT_STREAK_ICON,
  GAMIFICATION_LEVEL_ICON,
  GAMIFICATION_LONGEST_STREAK_ICON,
  GAMIFICATION_PROGRESS_MAX,
  GAMIFICATION_PROGRESS_MIN,
} from "~/constants/gamification";
import {
  FLUID_WIDTH_CLASS,
  FONT_WEIGHT_TOKEN_CLASS,
  HEIGHT_TOKEN_CLASS,
  MARGIN_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  SURFACE_GLASS_CARD_STRONG_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

defineProps<{
  progress: UserGamificationData;
  levelProgress: number;
  xpTarget: number;
  xpUntilNextLevel: number;
  unlockedAchievementsCount: number;
}>();

const { t } = useI18n();
</script>

<template>
  <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack6]">
    <section :class="[SURFACE_GLASS_CARD_STRONG_CLASS, 'text-on-glass']">
      <div class="card-body">
        <div class="flex items-center justify-between" :class="[MARGIN_TOKEN_CLASS.mb4]">
          <div>
            <h2 :class="[FONT_WEIGHT_TOKEN_CLASS.bold, TYPOGRAPHY_SCALE_CLASS.xl3]">{{ t("gamificationPage.levelPrefix") }} {{ progress.level }}</h2>
            <p class="text-secondary">
              {{ progress.xp }} / {{ xpTarget }} {{ t("gamificationPage.xpSuffix") }}
            </p>
          </div>
          <div :class="[TYPOGRAPHY_SCALE_CLASS.xl6]" aria-hidden="true">{{ GAMIFICATION_LEVEL_ICON }}</div>
        </div>

        <progress class="progress progress-primary" :class="[FLUID_WIDTH_CLASS, HEIGHT_TOKEN_CLASS.h4]" :value="levelProgress" :max="GAMIFICATION_PROGRESS_MAX" :aria-valuenow="levelProgress" :aria-valuemin="GAMIFICATION_PROGRESS_MIN" :aria-valuemax="GAMIFICATION_PROGRESS_MAX" :aria-label="t('gamificationPage.a11y.levelProgress')"></progress>

        <p class="text-secondary" :class="[MARGIN_TOKEN_CLASS.mt2, TYPOGRAPHY_SCALE_CLASS.sm]">
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
