<script setup lang="ts">
import type { UserGamificationData } from "@bao/shared/types/gamification";
import { useI18n } from "vue-i18n";
import UiRadialMeter from "~/components/ui/UiRadialMeter.vue";
import { DASHBOARD_A11Y_KEYS } from "~/constants/dashboard-copy";
import {
  DASHBOARD_GAMIFICATION_PROGRESS_MAX,
  DASHBOARD_GAMIFICATION_PROGRESS_MIN,
} from "~/constants/dashboard-core";
import {
  GAMIFICATION_CURRENT_STREAK_ICON,
  GAMIFICATION_LEVEL_ICON,
} from "~/constants/gamification";
import {
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  FONT_WEIGHT_TOKEN_CLASS,
  ICON_SIZE_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  SURFACE_GLASS_CARD_CLASS,
  TRUNCATE_FLEX_CHILD_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import { RESPONSIVE_FLEX_COL_SM_ROW_CLASS } from "~/constants/ui-layout";

defineProps<{
  gamification: UserGamificationData;
  levelProgress: number;
  /** XP progress inside the current level (matches radial %). */
  xpIntoLevel: number;
  xpTarget: number;
}>();

const { t } = useI18n();
</script>

<template>
  <section :class="SURFACE_GLASS_CARD_CLASS">
    <div class="card-body">
      <div
        class="sm:items-center sm:justify-between"
        :class="[RESPONSIVE_FLEX_COL_SM_ROW_CLASS, FLEX_GAP_TOKEN_CLASS.gap4, FLEX_GAP_TOKEN_CLASS.gap6]"
      >
        <div class="flex-1" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack2, TRUNCATE_FLEX_CHILD_CLASS]">
          <div class="flex items-center" :class="[FLEX_GAP_TOKEN_CLASS.gap3, TRUNCATE_FLEX_CHILD_CLASS]">
            <span :class="[TYPOGRAPHY_SCALE_CLASS.xl2]" aria-hidden="true">{{ GAMIFICATION_LEVEL_ICON }}</span>
            <div :class="[TRUNCATE_FLEX_CHILD_CLASS]">
              <p class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
                {{ t("dashboard.levelLabel") }} {{ gamification.level }}
              </p>
              <p :class="[FONT_WEIGHT_TOKEN_CLASS.bold]">
                {{
                  t("xpBar.progressLabel", {
                    xp: xpIntoLevel,
                    xpForNextLevel: xpTarget,
                  })
                }}
              </p>
            </div>
          </div>
          <progress 
            class="progress progress-primary" :class="[FLUID_WIDTH_CLASS]"
            :value="levelProgress"
            :max="DASHBOARD_GAMIFICATION_PROGRESS_MAX"
            :aria-valuenow="levelProgress"
            :aria-valuemin="DASHBOARD_GAMIFICATION_PROGRESS_MIN"
            :aria-valuemax="DASHBOARD_GAMIFICATION_PROGRESS_MAX"
            :aria-label="t(DASHBOARD_A11Y_KEYS.levelProgressAria)"
          ></progress>
        </div>

        <div class="flex shrink-0 items-center justify-between sm:justify-end" :class="[FLEX_GAP_TOKEN_CLASS.gap6]">
          <UiRadialMeter 
            :value="levelProgress"
            :max="DASHBOARD_GAMIFICATION_PROGRESS_MAX"
            :size-class="ICON_SIZE_CLASS['20']"
            fill-class="stroke-primary"
            :aria-label="t(DASHBOARD_A11Y_KEYS.levelProgressAria)"
          >
            <span :class="[FONT_WEIGHT_TOKEN_CLASS.bold, TYPOGRAPHY_SCALE_CLASS.sm]">{{ levelProgress }}%</span>
          </UiRadialMeter>

          <div v-if="gamification.currentStreak" class="shrink-0 text-center whitespace-nowrap">
            <div :class="[TYPOGRAPHY_SCALE_CLASS.xl3]" aria-hidden="true">{{ GAMIFICATION_CURRENT_STREAK_ICON }}</div>
            <p :class="[FONT_WEIGHT_TOKEN_CLASS.bold, TYPOGRAPHY_SCALE_CLASS.xl2]">{{ gamification.currentStreak }}</p>
            <p class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">{{ t("dashboard.streakLabel") }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
