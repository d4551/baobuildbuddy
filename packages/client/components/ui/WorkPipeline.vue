<script setup lang="ts">
import { DashboardPipelineStepViewModel, useI18n } from "vue-i18n";
import type {   DashboardPipelineStatus,
  } from "~/constants/dashboard-contracts";
import { DASHBOARD_PIPELINE_STATUS_KEYS } from "~/constants/dashboard-copy";
import {
  BADGE_SM_CLASS,
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  SURFACE_GLASS_CARD_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

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
  complete: "badge-success",
  inProgress: "badge-info",
  pending: "badge-ghost",
};
</script>

<template>
  <section :class="SURFACE_GLASS_CARD_CLASS">
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
            class="link link-hover inline-flex max-w-full min-w-0 flex-col flex-wrap items-start xl:items-center xl:text-center"
            :class="[FLEX_GAP_TOKEN_CLASS.gap1]"
            :aria-current="step.status === 'inProgress' ? 'step' : undefined"
          >
            <span class="min-w-0 whitespace-normal">{{ t(step.labelKey) }}</span>
            <span
 class="shrink-0 whitespace-nowrap"
 :class="[BADGE_SM_CLASS, statusBadgeClassByStepStatus[step.status]]"
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
  </section>
</template>
