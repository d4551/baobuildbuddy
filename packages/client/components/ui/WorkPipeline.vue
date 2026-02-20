<script setup lang="ts">
import { useI18n } from "vue-i18n";
import {
  DASHBOARD_PIPELINE_STATUS_KEYS,
  type DashboardPipelineStatus,
  type DashboardPipelineStepViewModel,
} from "~/constants/dashboard";

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
  <section class="card bg-base-200">
    <div class="card-body gap-4">
      <div>
        <h2 class="card-title text-lg">{{ props.title }}</h2>
        <p class="text-sm text-base-content/70">{{ props.description }}</p>
      </div>

      <ul class="steps steps-vertical xl:steps-horizontal w-full" :aria-label="props.ariaLabel">
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
            class="inline-flex items-center gap-2 link link-hover"
            :aria-current="step.status === 'inProgress' ? 'step' : undefined"
          >
            <span>{{ t(step.labelKey) }}</span>
            <span class="badge badge-xs whitespace-nowrap" :class="statusBadgeClassByStepStatus[step.status]">
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
