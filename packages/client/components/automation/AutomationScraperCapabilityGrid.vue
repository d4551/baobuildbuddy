<script setup lang="ts">
import type { AutomationScrapeTarget } from "@bao/shared/constants/automation";
import { useI18n } from "vue-i18n";
import { STACK_SPACE_Y_TOKEN_CLASS, TYPOGRAPHY_SCALE_CLASS } from "~/constants/layout";
import type {
  AutomationRunEnvelope,
  AutomationScraperRunState,
  ScrapeCapabilityCard,
  ScrapePendingAction,
  TargetRecord,
} from "~/types/automation-scraper";

const props = defineProps<{
  capabilities: readonly ScrapeCapabilityCard[];
  runStates: TargetRecord<AutomationScraperRunState>;
  runMessages: TargetRecord<string>;
  scheduledRunAt: TargetRecord<string>;
  latestRuns: TargetRecord<AutomationRunEnvelope | null>;
  pendingAction: ScrapePendingAction | null;
  cardDescription: (target: AutomationScrapeTarget) => string;
  cardRunAria: (target: AutomationScrapeTarget) => string;
  cardRunButtonLabel: (target: AutomationScrapeTarget) => string;
  capabilityAvailabilityLabel: (capability: ScrapeCapabilityCard) => string;
  capabilityAvailabilityBadgeClass: (capability: ScrapeCapabilityCard) => string;
  runStateLabel: (state: AutomationScraperRunState) => string;
  runStateBadgeClass: (state: AutomationScraperRunState) => string;
  latestRunNoticeText: (target: AutomationScrapeTarget) => string;
  latestRunStatusText: (target: AutomationScrapeTarget) => string;
  isPendingAction: (target: AutomationScrapeTarget, action: "run" | "schedule") => boolean;
  automationRunsRoute: string;
  buildRunDetailRoute: (id: string) => string;
}>();

const emit = defineEmits<{
  run: [target: AutomationScrapeTarget];
  schedule: [target: AutomationScrapeTarget];
  "update:scheduledRunAt": [target: AutomationScrapeTarget, value: string];
}>();

const { t } = useI18n();

const readyCapabilities = computed(() =>
  props.capabilities.filter(
    (capability) => capability.configured && capability.issues.length === 0,
  ),
);

const attentionCapabilities = computed(() =>
  props.capabilities.filter((capability) => !capability.configured || capability.issues.length > 0),
);

function handleScheduledRunAtUpdate(payload: {
  target: AutomationScrapeTarget;
  value: string;
}): void {
  emit("update:scheduledRunAt", payload.target, payload.value);
}
</script>

<template>
  <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack8]">
    <!-- Section title/description owned by WorkspaceSectionNavigator — do not repeat here. -->
    <section v-if="readyCapabilities.length > 0" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4]" :aria-label="t('automation.scraper.sections.providers.label')">
      <SectionGrid grid-token="twoColumnXl">
        <AutomationScraperCapabilityCard
          v-for="capability in readyCapabilities"
          :key="capability.id"
          :capability="capability"
          :run-state="runStates[capability.target]"
          :run-message="runMessages[capability.target]"
          :scheduled-run-at="scheduledRunAt[capability.target]"
          :latest-run="latestRuns[capability.target]"
          :pending-action="pendingAction"
          :card-description="cardDescription"
          :card-run-aria="cardRunAria"
          :card-run-button-label="cardRunButtonLabel"
          :capability-availability-label="capabilityAvailabilityLabel"
          :capability-availability-badge-class="capabilityAvailabilityBadgeClass"
          :run-state-label="runStateLabel"
          :run-state-badge-class="runStateBadgeClass"
          :latest-run-notice-text="latestRunNoticeText"
          :latest-run-status-text="latestRunStatusText"
          :is-pending-action="isPendingAction"
          :automation-runs-route="automationRunsRoute"
          :build-run-detail-route="buildRunDetailRoute"
          @run="emit('run', $event)"
          @schedule="emit('schedule', $event)"
          @update:scheduled-run-at="handleScheduledRunAtUpdate"
        />
      </SectionGrid>
    </section>

    <section v-if="attentionCapabilities.length > 0" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4]">
      <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack1]">
        <h2 class="font-semibold text-base-content" :class="[TYPOGRAPHY_SCALE_CLASS.lg]">
          {{ t("automation.scraper.providerCard.issuesTitle") }}
        </h2>
        <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
          {{ t("automation.scraper.providerCard.issuesNeedsAttention") }}
        </p>
      </div>

      <SectionGrid grid-token="twoColumnXl">
        <AutomationScraperCapabilityCard 
          v-for="capability in attentionCapabilities"
          :key="capability.id"
          :capability="capability"
          :run-state="runStates[capability.target]"
          :run-message="runMessages[capability.target]"
          :scheduled-run-at="scheduledRunAt[capability.target]"
          :latest-run="latestRuns[capability.target]"
          :pending-action="pendingAction"
          :card-description="cardDescription"
          :card-run-aria="cardRunAria"
          :card-run-button-label="cardRunButtonLabel"
          :capability-availability-label="capabilityAvailabilityLabel"
          :capability-availability-badge-class="capabilityAvailabilityBadgeClass"
          :run-state-label="runStateLabel"
          :run-state-badge-class="runStateBadgeClass"
          :latest-run-notice-text="latestRunNoticeText"
          :latest-run-status-text="latestRunStatusText"
          :is-pending-action="isPendingAction"
          :automation-runs-route="automationRunsRoute"
          :build-run-detail-route="buildRunDetailRoute"
          compact-mode
          @run="emit('run', $event)"
          @schedule="emit('schedule', $event)"
          @update:scheduled-run-at="handleScheduledRunAtUpdate"
        />
      </SectionGrid>
    </section>
  </div>
</template>
