<script setup lang="ts">
import type { AutomationScrapeTarget } from "@bao/shared/constants/automation";
import { useI18n } from "vue-i18n";
import {
  FLUID_WIDTH_CLASS,
  GHOST_ACTION_DENSE_CLASS,
  INSET_PANEL_MUTED_CLASS,
  OUTLINE_ACTION_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  TOUCH_TARGET_MIN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import type {
  AutomationRunEnvelope,
  ScrapeCapabilityCard,
  ScrapePendingAction,
} from "~/types/automation-scraper";

const props = defineProps<{
  capability: ScrapeCapabilityCard;
  scheduledRunAt: string;
  latestRun: AutomationRunEnvelope | null;
  pendingAction: ScrapePendingAction | null;
  latestRunNoticeText: (target: AutomationScrapeTarget) => string;
  latestRunStatusText: (target: AutomationScrapeTarget) => string;
  isPendingAction: (target: AutomationScrapeTarget, action: "run" | "schedule") => boolean;
  buildRunDetailRoute: (id: string) => string;
}>();

const emit = defineEmits<{
  schedule: [target: AutomationScrapeTarget];
  "update:scheduledRunAt": [payload: { target: AutomationScrapeTarget; value: string }];
}>();

const { t } = useI18n();

function handleScheduleInput(event: Event): void {
  const input = event.target;
  if (input instanceof HTMLInputElement) {
    emit("update:scheduledRunAt", { target: props.capability.target, value: input.value });
  }
}
</script>

<template>
  <details :class="[INSET_PANEL_MUTED_CLASS, 'collapse collapse-arrow']">
    <summary class="collapse-title text-base font-semibold">
      {{ t("automation.scraper.schedule.disclosureTitle") }}
    </summary>
    <div class="collapse-content" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4]">
      <fieldset class="fieldset">
        <legend class="fieldset-legend">{{ t("automation.scraper.schedule.legend") }}</legend>
        <input
          :value="scheduledRunAt"
          class="input"
          :class="[FLUID_WIDTH_CLASS]"
          type="datetime-local"
          :aria-label="t('automation.scraper.schedule.aria')"
          @input="handleScheduleInput"
        />
        <p class="label">{{ t("automation.scraper.schedule.hint") }}</p>
      </fieldset>
      <div class="card-actions justify-end">
        <button
          type="button"
          :class="[OUTLINE_ACTION_CLASS]"
          :aria-label="t('automation.scraper.schedule.buttonAria')"
          :disabled="pendingAction !== null || !capability.configured || !scheduledRunAt"
          @click="emit('schedule', capability.target)"
        >
          <LoadingSpinner
            v-if="isPendingAction(capability.target, 'schedule')"
            size="xs"
            :label="t('common.loading')"
          />
          <span>{{ t("automation.scraper.schedule.button") }}</span>
        </button>
      </div>
    </div>
  </details>

  <details
    v-if="latestRun"
    :class="[INSET_PANEL_MUTED_CLASS, 'collapse collapse-arrow']"
  >
    <summary class="collapse-title text-base font-semibold">
      {{ latestRunNoticeText(capability.target) }}
    </summary>
    <div class="collapse-content" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4]">
      <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
        {{ latestRunStatusText(capability.target) }}
      </p>
      <div class="card-actions justify-end">
        <NuxtLink
          :to="buildRunDetailRoute(latestRun.id)"
          :class="[TOUCH_TARGET_MIN_CLASS, GHOST_ACTION_DENSE_CLASS]"
          :aria-label="t('automation.scraper.openRunDetailAria', { id: latestRun.id })"
        >
          {{ t("automation.scraper.openRunDetailButton") }}
        </NuxtLink>
      </div>
    </div>
  </details>
</template>
