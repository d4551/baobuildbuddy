<script setup lang="ts">
import type { AutomationScrapeTarget } from "@bao/shared/constants/automation";
import { useI18n } from "vue-i18n";
import {
  FLEX_GAP_TOKEN_CLASS,
  PRIMARY_ACTION_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
} from "~/constants/layout";
import type {
  AutomationScraperRunState,
  ScrapeCapabilityCard,
  ScrapePendingAction,
} from "~/types/automation-scraper";

defineProps<{
  capability: ScrapeCapabilityCard;
  runState: AutomationScraperRunState;
  runMessage: string;
  pendingAction: ScrapePendingAction | null;
  cardRunAria: (target: AutomationScrapeTarget) => string;
  cardRunButtonLabel: (target: AutomationScrapeTarget) => string;
  runStateLabel: (state: AutomationScraperRunState) => string;
  isPendingAction: (target: AutomationScrapeTarget, action: "run" | "schedule") => boolean;
}>();

const emit = defineEmits<{
  run: [target: AutomationScrapeTarget];
}>();

const { t } = useI18n();
</script>

<template>
  <div :class="['flex', 'justify-end', FLEX_GAP_TOKEN_CLASS.gap3]">
    <button
      type="button"
      :class="[PRIMARY_ACTION_CLASS]"
      :aria-label="cardRunAria(capability.target)"
      :disabled="pendingAction !== null || !capability.configured"
      @click="emit('run', capability.target)"
    >
      <LoadingSpinner
        v-if="isPendingAction(capability.target, 'run')"
        size="xs"
        :label="t('common.loading')"
      />
      <span>{{ cardRunButtonLabel(capability.target) }}</span>
    </button>
  </div>

  <div v-if="runState !== 'idle'" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack3]">
    <div
      v-if="runState === 'running'"
      aria-live="polite"
      class="alert alert-info alert-vertical sm:alert-horizontal"
    >
      <LoadingSpinner size="xs" :label="t('common.loading')" />
      <span>{{ runStateLabel(runState) }}</span>
    </div>
    <div
      v-else-if="runState === 'success'"
      role="alert"
      class="alert alert-success alert-vertical sm:alert-horizontal"
    >
      <span>{{ runMessage }}</span>
    </div>
    <div
      v-else-if="runState === 'error'"
      role="alert"
      class="alert alert-error alert-vertical sm:alert-horizontal"
    >
      <span>{{ runMessage }}</span>
    </div>
  </div>
</template>
