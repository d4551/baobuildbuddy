<script setup lang="ts">
import { useI18n } from "vue-i18n";
import {
  DASHBOARD_A11Y_KEYS,
  DASHBOARD_COPY_KEYS,
  DASHBOARD_DAILY_CHALLENGE_XP_LABEL_KEY,
} from "~/constants/dashboard-copy";
import { DASHBOARD_GAMIFICATION_PROGRESS_MIN } from "~/constants/dashboard-core";
import { getDashboardActivityPresentation } from "~/constants/dashboard-pipeline";
import {
  FLEX_GAP_TOKEN_CLASS,
  FLUID_HEIGHT_CLASS,
  ICON_DECORATIVE_STROKE_WIDTH,
  PADDING_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  SURFACE_GLASS_CARD_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import type { DashboardActivity, DashboardChallengeViewModel } from "./dashboard-page-contracts";

defineProps<{
  dailyChallenge: DashboardChallengeViewModel | null;
  recentActivity: readonly DashboardActivity[];
  formatTimeAgo: (timestamp: Date) => string;
}>();

const { t } = useI18n();
</script>

<template>
  <SectionGrid grid-token="twoColumnWide">
    <div v-if="dailyChallenge" :class="[SURFACE_GLASS_CARD_CLASS, FLUID_HEIGHT_CLASS]">
      <div class="card-body" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack3]">
        <h2 class="card-title" :class="[TYPOGRAPHY_SCALE_CLASS.lg]">{{ t(DASHBOARD_COPY_KEYS.dailyChallengeTitle) }}</h2>
        <div class="rounded-box border border-base-300 bg-base-100" :class="[PADDING_TOKEN_CLASS.p4]">
          <div class="flex items-center justify-between" :class="[FLEX_GAP_TOKEN_CLASS.gap3]">
            <h3 class="font-semibold">{{ dailyChallenge.name }}</h3>
            <span class="badge badge-primary">
              {{ t(DASHBOARD_DAILY_CHALLENGE_XP_LABEL_KEY, { xp: dailyChallenge.xpReward }) }}
            </span>
          </div>
          <div class="flex items-center" :class="[FLEX_GAP_TOKEN_CLASS.gap3]">
            <progress 
              class="progress flex-1"
              :class="dailyChallenge.completed ? 'progress-success' : 'progress-primary'"
              :value="dailyChallenge.progress"
              :max="dailyChallenge.goal"
              :aria-valuenow="dailyChallenge.progress"
              :aria-valuemin="DASHBOARD_GAMIFICATION_PROGRESS_MIN"
              :aria-valuemax="dailyChallenge.goal"
              :aria-label="t(DASHBOARD_A11Y_KEYS.challengeProgressAria)"
            ></progress>
            <span class="font-medium" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
              {{ dailyChallenge.progress }} / {{ dailyChallenge.goal }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div :class="[SURFACE_GLASS_CARD_CLASS, FLUID_HEIGHT_CLASS]">
      <div class="card-body" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack3]">
        <h2 class="card-title" :class="[TYPOGRAPHY_SCALE_CLASS.lg]">{{ t(DASHBOARD_COPY_KEYS.recentActivityTitle) }}</h2>
        <ul class="list rounded-box border border-base-300 bg-base-100">
          <li 
            v-for="(activity, index) in recentActivity"
            :key="`${activity.timestamp.toISOString()}-${index}`"
            class="list-row items-center"
          >
            <div :class="getDashboardActivityPresentation(activity.type).avatarClass">
              <svg 
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                :stroke-width="ICON_DECORATIVE_STROKE_WIDTH"
                :class="getDashboardActivityPresentation(activity.type).iconClass"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  :d="getDashboardActivityPresentation(activity.type).iconPath"
                />
              </svg>
            </div>
            <div class="list-col-grow">
              <p class="font-medium" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ activity.description }}</p>
              <p class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">{{ formatTimeAgo(activity.timestamp) }}</p>
            </div>
          </li>

          <li 
            v-if="recentActivity.length === 0"
            class="list-row text-center text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.sm]"
          >
            {{ t(DASHBOARD_COPY_KEYS.recentActivityEmptyLabel) }}
          </li>
        </ul>
      </div>
    </div>
  </SectionGrid>
</template>
