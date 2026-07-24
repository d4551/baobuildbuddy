<script setup lang="ts">
import { APP_ROUTES } from "@bao/shared/constants/routes";
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
  INSET_LIST_CLASS,
  INSET_PANEL_CLASS,
  PADDING_TOKEN_CLASS,
  PRIMARY_ACTION_CLASS,
  PROGRESS_BAR_VARIANT_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import {
  BADGE_PRIMARY_CLASS,
} from "~/constants/layout-badges";
import type { DashboardActivity, DashboardChallengeViewModel } from "./dashboard-page-contracts";

const props = defineProps<{
  dailyChallenge: DashboardChallengeViewModel | null;
  recentActivity: readonly DashboardActivity[];
  claimingChallengeId: string | null;
  formatTimeAgo: (timestamp: Date) => string;
}>();

const emit = defineEmits<{
  claim: [challengeId: string];
}>();

const { t } = useI18n();

const canClaimChallenge = computed(() => {
  const challenge = props.dailyChallenge;
  if (!challenge || challenge.completed) {
    return false;
  }
  return challenge.progress >= challenge.goal;
});
</script>

<template>
  <SectionGrid grid-token="twoColumnWide">
    <UiGlassCard v-if="dailyChallenge" :extra-class="FLUID_HEIGHT_CLASS">
      <div class="card-body" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack3]">
        <h2 class="card-title" :class="[TYPOGRAPHY_SCALE_CLASS.lg]">{{ t(DASHBOARD_COPY_KEYS.dailyChallengeTitle) }}</h2>
        <div :class="[INSET_PANEL_CLASS, PADDING_TOKEN_CLASS.p4, STACK_SPACE_Y_TOKEN_CLASS.stack3]">
          <div class="flex items-center justify-between" :class="[FLEX_GAP_TOKEN_CLASS.gap3]">
            <h3 class="font-semibold">{{ dailyChallenge.name }}</h3>
            <span :class="[BADGE_PRIMARY_CLASS]">
              {{ t(DASHBOARD_DAILY_CHALLENGE_XP_LABEL_KEY, { xp: dailyChallenge.xpReward }) }}
            </span>
          </div>
          <div class="flex items-center" :class="[FLEX_GAP_TOKEN_CLASS.gap3]">
            <progress
              class="progress flex-1"
              :class="dailyChallenge.completed ? PROGRESS_BAR_VARIANT_CLASS.success : PROGRESS_BAR_VARIANT_CLASS.primary"
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
          <div v-if="canClaimChallenge" class="card-actions justify-end">
            <button
              type="button"
              :class="[PRIMARY_ACTION_CLASS]"
              :disabled="claimingChallengeId === dailyChallenge.id"
              :aria-label="t('dashboard.claimChallengeAria', { name: dailyChallenge.name })"
              @click="emit('claim', dailyChallenge.id)"
            >
              <LoadingSpinner
                v-if="claimingChallengeId === dailyChallenge.id"
                size="xs"
                :label="t('common.loading')"
                aria-hidden="true"
              />
              {{ t("dashboard.claimChallengeLabel") }}
            </button>
          </div>
          <p
            v-else-if="dailyChallenge.completed"
            class="text-success"
            :class="[TYPOGRAPHY_SCALE_CLASS.sm]"
          >
            {{ t("dashboard.challengeCompletedLabel") }}
          </p>
        </div>
      </div>
    </UiGlassCard>

    <UiGlassCard :extra-class="FLUID_HEIGHT_CLASS">
      <div class="card-body" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack3]">
        <h2 class="card-title" :class="[TYPOGRAPHY_SCALE_CLASS.lg]">{{ t(DASHBOARD_COPY_KEYS.recentActivityTitle) }}</h2>
        <ul
          v-if="recentActivity.length > 0"
          :class="[INSET_LIST_CLASS]"
        >
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
        </ul>
        <EmptyState
          v-else
          title-key="dashboard.recentActivityEmptyTitle"
          description-key="dashboard.recentActivityEmptyDescription"
          cta-label-key="dashboard.recentActivityEmptyCta"
          :cta-to="APP_ROUTES.jobs"
        />
      </div>
    </UiGlassCard>
  </SectionGrid>
</template>
