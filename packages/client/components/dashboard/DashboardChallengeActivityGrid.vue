<script setup lang="ts">
import { useI18n } from "vue-i18n";
import {
  DASHBOARD_A11Y_KEYS,
  DASHBOARD_COPY_KEYS,
  DASHBOARD_DAILY_CHALLENGE_XP_LABEL_KEY,
} from "~/constants/dashboard-copy";
import { DASHBOARD_GAMIFICATION_PROGRESS_MIN } from "~/constants/dashboard-core";
import { getDashboardActivityPresentation } from "~/constants/dashboard-pipeline";
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
    <div v-if="dailyChallenge" class="card h-full bg-base-200">
      <div class="card-body">
        <h2 class="card-title mb-3 text-lg">{{ t(DASHBOARD_COPY_KEYS.dailyChallengeTitle) }}</h2>
        <div class="card bg-base-100">
          <div class="card-body gap-3 p-4">
            <div class="flex items-center justify-between gap-3">
              <h3 class="font-semibold">{{ dailyChallenge.name }}</h3>
              <span class="badge badge-primary">
                {{ t(DASHBOARD_DAILY_CHALLENGE_XP_LABEL_KEY, { xp: dailyChallenge.xpReward }) }}
              </span>
            </div>
            <div class="flex items-center gap-3">
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
              <span class="text-sm font-medium">
                {{ dailyChallenge.progress }} / {{ dailyChallenge.goal }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card h-full bg-base-200">
      <div class="card-body">
        <h2 class="card-title mb-3 text-lg">{{ t(DASHBOARD_COPY_KEYS.recentActivityTitle) }}</h2>
        <ul class="list rounded-box bg-base-100">
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
                stroke-width="1.75"
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
              <p class="text-sm font-medium">{{ activity.description }}</p>
              <p class="text-xs text-muted">{{ formatTimeAgo(activity.timestamp) }}</p>
            </div>
          </li>

          <li
            v-if="recentActivity.length === 0"
            class="list-row text-center text-sm text-muted"
          >
            {{ t(DASHBOARD_COPY_KEYS.recentActivityEmptyLabel) }}
          </li>
        </ul>
      </div>
    </div>
  </SectionGrid>
</template>
