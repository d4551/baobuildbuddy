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
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  FONT_WEIGHT_TOKEN_CLASS,
  ICON_SIZE_CLASS,
  PADDING_TOKEN_CLASS,
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
    <div class="card-body" :class="[PADDING_TOKEN_CLASS.p4]">
      <div
        class="sm:items-center sm:justify-between"
        :class="[RESPONSIVE_FLEX_COL_SM_ROW_CLASS, FLEX_GAP_TOKEN_CLASS.gap3]"
      >
        <div class="flex-1" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack2, TRUNCATE_FLEX_CHILD_CLASS]">
          <div class="flex items-center" :class="[FLEX_GAP_TOKEN_CLASS.gap2, TRUNCATE_FLEX_CHILD_CLASS]">
            <IconSparkles class="text-primary" :class="[ICON_SIZE_CLASS['6']]" aria-hidden="true" />
            <div :class="[TRUNCATE_FLEX_CHILD_CLASS]">
              <p class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
                {{ t("xpBar.levelBadge", { level: gamification.level }) }}
              </p>
              <p :class="[FONT_WEIGHT_TOKEN_CLASS.bold, TYPOGRAPHY_SCALE_CLASS.sm]">
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

        <!-- Streak leads radial so FAB (end) cannot occlude primary streak chrome @320. -->
        <div class="flex shrink-0 items-center justify-start sm:justify-end" :class="[FLEX_GAP_TOKEN_CLASS.gap4]">
          <div v-if="gamification.currentStreak" class="shrink-0 text-center whitespace-nowrap">
            <IconBolt class="mx-auto text-warning" :class="[ICON_SIZE_CLASS['6']]" aria-hidden="true" />
            <p :class="[FONT_WEIGHT_TOKEN_CLASS.bold, TYPOGRAPHY_SCALE_CLASS.lg]">{{ gamification.currentStreak }}</p>
            <p class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">{{ t("dashboard.streakLabel") }}</p>
          </div>

          <UiRadialMeter 
            :value="levelProgress"
            :max="DASHBOARD_GAMIFICATION_PROGRESS_MAX"
            :size-class="ICON_SIZE_CLASS['16']"
            fill-class="stroke-primary"
            :aria-label="t(DASHBOARD_A11Y_KEYS.levelProgressAria)"
          >
            <span :class="[FONT_WEIGHT_TOKEN_CLASS.bold, TYPOGRAPHY_SCALE_CLASS.sm]">{{ levelProgress }}%</span>
          </UiRadialMeter>
        </div>
      </div>
    </div>
  </section>
</template>
