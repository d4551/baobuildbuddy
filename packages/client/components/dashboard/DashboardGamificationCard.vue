<script setup lang="ts">
import type { UserGamificationData } from "@bao/shared/types/gamification";
import { useI18n } from "vue-i18n";
import { DASHBOARD_A11Y_KEYS } from "~/constants/dashboard-copy";
import {
  DASHBOARD_GAMIFICATION_PROGRESS_MAX,
  DASHBOARD_GAMIFICATION_PROGRESS_MIN,
  getDashboardGamificationDialStyle,
} from "~/constants/dashboard-core";
import {
  GAMIFICATION_CURRENT_STREAK_ICON,
  GAMIFICATION_LEVEL_ICON,
} from "~/constants/gamification";

defineProps<{
  gamification: UserGamificationData;
  levelProgress: number;
  xpTarget: number;
}>();

const { t } = useI18n();
</script>

<template>
  <section class="card bg-base-200">
    <div class="card-body">
      <div class="flex items-center justify-between gap-6">
        <div class="flex-1 space-y-2">
          <div class="flex items-center gap-3">
            <span class="text-2xl" aria-hidden="true">{{ GAMIFICATION_LEVEL_ICON }}</span>
            <div>
              <p class="text-sm text-base-content/60">
                {{ t("dashboard.levelLabel") }} {{ gamification.level }}
              </p>
              <p class="font-bold">
                {{
                  t("xpBar.progressLabel", {
                    xp: gamification.xp,
                    xpForNextLevel: xpTarget,
                  })
                }}
              </p>
            </div>
          </div>
          <progress
            class="progress progress-primary w-full"
            :value="levelProgress"
            :max="DASHBOARD_GAMIFICATION_PROGRESS_MAX"
            :aria-valuenow="levelProgress"
            :aria-valuemin="DASHBOARD_GAMIFICATION_PROGRESS_MIN"
            :aria-valuemax="DASHBOARD_GAMIFICATION_PROGRESS_MAX"
            :aria-label="t(DASHBOARD_A11Y_KEYS.levelProgressAria)"
          ></progress>
        </div>

        <div class="flex items-center gap-6">
          <div
            class="radial-progress text-primary"
            :style="getDashboardGamificationDialStyle(levelProgress)"
            role="progressbar"
            :aria-valuenow="levelProgress"
            :aria-valuemin="DASHBOARD_GAMIFICATION_PROGRESS_MIN"
            :aria-valuemax="DASHBOARD_GAMIFICATION_PROGRESS_MAX"
            :aria-label="t(DASHBOARD_A11Y_KEYS.levelProgressAria)"
          >
            <span class="text-sm font-bold">{{ levelProgress }}%</span>
          </div>

          <div v-if="gamification.currentStreak" class="text-center">
            <div class="text-3xl" aria-hidden="true">{{ GAMIFICATION_CURRENT_STREAK_ICON }}</div>
            <p class="text-2xl font-bold">{{ gamification.currentStreak }}</p>
            <p class="text-xs text-base-content/60">{{ t("dashboard.streakLabel") }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
