<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type {
  DashboardPipelineStatus,
  DashboardPipelineStepViewModel,
} from "~/constants/dashboard-contracts";
import { DASHBOARD_PIPELINE_STATUS_KEYS } from "~/constants/dashboard-copy";
import {
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import {
  BADGE_GHOST_XS_CLASS,
  BADGE_INFO_SM_CLASS,
  BADGE_SUCCESS_SM_CLASS,
} from "~/constants/layout-badges";

interface WorkPipelineProps {
  readonly title: string;
  readonly description: string;
  readonly steps: readonly DashboardPipelineStepViewModel[];
  readonly nextStepLabel: string;
  readonly ariaLabel: string;
}

const props = defineProps<WorkPipelineProps>();
const { t } = useI18n();

const statusBadgeClassByStepStatus: Record<DashboardPipelineStatus, string> = {
  complete: BADGE_SUCCESS_SM_CLASS,
  inProgress: BADGE_INFO_SM_CLASS,
  pending: BADGE_GHOST_XS_CLASS,
};
</script>

<template>
  <UiGlassCard>
    <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap4]">
      <div>
        <h2 class="card-title" :class="[TYPOGRAPHY_SCALE_CLASS.lg]">{{ props.title }}</h2>
        <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ props.description }}</p>
      </div>

      <ul class="steps steps-vertical xl:steps-horizontal" :class="[FLUID_WIDTH_CLASS]" :aria-label="props.ariaLabel">
        <li 
          v-for="step in props.steps"
          :key="step.id"
          class="step"
          :class="{
            'step-primary': step.status === 'complete',
            'step-secondary': step.status === 'inProgress',
          }"
        >
          <NuxtLink 
            :to="step.to"
            class="inline-flex items-center link link-hover" :class="[FLEX_GAP_TOKEN_CLASS.gap2]"
            :aria-current="step.status === 'inProgress' ? 'step' : undefined"
          >
            <span>{{ t(step.labelKey) }}</span>
            <span
              class="whitespace-nowrap"
              :class="[statusBadgeClassByStepStatus[step.status]]"
            >
              {{ t(DASHBOARD_PIPELINE_STATUS_KEYS[step.status]) }}
            </span>
          </NuxtLink>
        </li>
      </ul>

      <div role="status" aria-live="polite" class="alert alert-soft">
        <span>{{ props.nextStepLabel }}</span>
      </div>
    </div>
  </UiGlassCard>
</template>
