<script setup lang="ts">
import { useI18n } from "vue-i18n";
import {
  PADDING_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

defineProps<{
  weekly: {
    challengesCompleted: number;
    xpEarned: number;
    actionsCount: number;
    topCategory: string;
  } | null;
  monthly: {
    totalXP: number;
    levelsGained: number;
    achievementsUnlocked: number;
    challengesCompleted: number;
    actionsCount: number;
    streakDays: number;
  } | null;
}>();

const { t } = useI18n();
</script>

<template>
  <UiGlassCard aria-labelledby="gamification-trends-title">
    <div class="card-body" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4]">
      <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack1]">
        <h2 id="gamification-trends-title" class="card-title" :class="[TYPOGRAPHY_SCALE_CLASS.lg]">
          {{ t("gamificationPage.trends.title") }}
        </h2>
        <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
          {{ t("gamificationPage.trends.description") }}
        </p>
      </div>

      <SectionGrid grid-token="twoColumn">
        <UiGlassCard variant="subtle" :stagger-index="0">
          <div class="card-body" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack2, PADDING_TOKEN_CLASS.p4]">
            <h3 class="font-semibold" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
              {{ t("gamificationPage.trends.weeklyTitle") }}
            </h3>
            <template v-if="weekly">
              <p :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
                {{ t("gamificationPage.trends.weeklyXp", { xp: weekly.xpEarned }) }}
              </p>
              <p :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
                {{ t("gamificationPage.trends.weeklyActions", { count: weekly.actionsCount }) }}
              </p>
              <p :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
                {{
                  t("gamificationPage.trends.weeklyChallenges", {
                    count: weekly.challengesCompleted,
                  })
                }}
              </p>
              <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">
                {{ t("gamificationPage.trends.topCategory", { category: weekly.topCategory }) }}
              </p>
            </template>
            <p v-else class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
              {{ t("gamificationPage.trends.weeklyEmpty") }}
            </p>
          </div>
        </UiGlassCard>

        <UiGlassCard variant="subtle" :stagger-index="1">
          <div class="card-body" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack2, PADDING_TOKEN_CLASS.p4]">
            <h3 class="font-semibold" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
              {{ t("gamificationPage.trends.monthlyTitle") }}
            </h3>
            <template v-if="monthly">
              <p :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
                {{ t("gamificationPage.trends.monthlyXp", { xp: monthly.totalXP }) }}
              </p>
              <p :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
                {{ t("gamificationPage.trends.monthlyLevels", { count: monthly.levelsGained }) }}
              </p>
              <p :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
                {{
                  t("gamificationPage.trends.monthlyAchievements", {
                    count: monthly.achievementsUnlocked,
                  })
                }}
              </p>
              <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">
                {{ t("gamificationPage.trends.monthlyStreak", { days: monthly.streakDays }) }}
              </p>
            </template>
            <p v-else class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
              {{ t("gamificationPage.trends.monthlyEmpty") }}
            </p>
          </div>
        </UiGlassCard>
      </SectionGrid>
    </div>
  </UiGlassCard>
</template>
