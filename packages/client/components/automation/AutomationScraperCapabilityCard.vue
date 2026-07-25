<script setup lang="ts">
import type { AutomationScrapeTarget } from "@bao/shared/constants/automation";
import { useI18n } from "vue-i18n";
import { resolveAppIconComponent } from "~/components/icons/icon-registry";
import {
  BADGE_SM_CLASS,
  BADGE_SOFT_SM_CLASS,
  FLEX_GAP_TOKEN_CLASS,
  FLUID_HEIGHT_CLASS,
  GHOST_ACTION_DENSE_CLASS,
  ICON_SIZE_CLASS,
  RADIUS_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  SURFACE_GLASS_CARD_CLASS,
  TOUCH_TARGET_MIN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import type {
  AutomationRunEnvelope,
  AutomationScraperRunState,
  ScrapeCapabilityCard,
  ScrapePendingAction,
} from "~/types/automation-scraper";
import { resolveAutomationCapabilityIssues } from "~/utils/automation-capabilities";
import { SCRAPE_TARGET_ICON_NAMES } from "./automation-visuals";

const props = defineProps<{
  capability: ScrapeCapabilityCard;
  runState: AutomationScraperRunState;
  runMessage: string;
  scheduledRunAt: string;
  latestRun: AutomationRunEnvelope | null;
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
  compactMode?: boolean;
}>();

const emit = defineEmits<{
  run: [target: AutomationScrapeTarget];
  schedule: [target: AutomationScrapeTarget];
  "update:scheduledRunAt": [payload: { target: AutomationScrapeTarget; value: string }];
}>();

const { t } = useI18n();

const issues = computed(() => resolveAutomationCapabilityIssues(props.capability, t));
const issueCount = computed(() => issues.value.length);
const capabilityIconName = computed(() => SCRAPE_TARGET_ICON_NAMES[props.capability.target]);
const latestRunRoute = computed(() =>
  props.latestRun ? props.buildRunDetailRoute(props.latestRun.id) : props.automationRunsRoute,
);
const showOperations = computed(() => !props.compactMode);

function readinessValueClass(): string {
  if (props.capability.configured) {
    return "text-success";
  }
  if (issueCount.value > 0) {
    return "text-warning";
  }
  return "text-error";
}

function latestRunValueClass(): string {
  if (props.runState === "success") {
    return "text-success";
  }
  if (props.runState === "error") {
    return "text-error";
  }
  if (props.runState === "running") {
    return "text-info";
  }
  return "text-base-content";
}
</script>

<template>
  <div :class="[SURFACE_GLASS_CARD_CLASS, FLUID_HEIGHT_CLASS]">
    <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap4]">
      <div class="flex flex-wrap items-start justify-between" :class="[FLEX_GAP_TOKEN_CLASS.gap3]">
        <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack2]">
          <div class="flex flex-wrap items-center" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
            <span class="tooltip tooltip-bottom" :data-tip="capability.name">
              <span
                class="inline-flex items-center justify-center border border-primary/30 bg-primary/10 text-primary"
                :class="[RADIUS_TOKEN_CLASS.full, ICON_SIZE_CLASS[8]]"
              >
                <component
                  :class="[ICON_SIZE_CLASS[4]]"
                  :is="resolveAppIconComponent(capabilityIconName)"
                  aria-hidden="true"
                />
                <span class="sr-only">{{ capability.name }}</span>
              </span>
            </span>
            <h2 class="card-title">{{ capability.name }}</h2>
            <span :class="[BADGE_SOFT_SM_CLASS, capabilityAvailabilityBadgeClass(capability)]">
              {{ capabilityAvailabilityLabel(capability) }}
            </span>
            <span :class="[BADGE_SM_CLASS, runStateBadgeClass(runState)]">
              {{ runStateLabel(runState) }}
            </span>
          </div>
          <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
            {{ cardDescription(capability.target) }}
          </p>
          <AutomationCoverageChips
            :manual-run-available="capability.manualRunAvailable"
            :scheduled-run-available="capability.scheduledRunAvailable"
            :run-history-available="capability.runHistoryAvailable"
            :live-updates-available="capability.liveUpdatesAvailable"
          />
        </div>

        <NuxtLink :to="latestRunRoute" :class="[TOUCH_TARGET_MIN_CLASS, GHOST_ACTION_DENSE_CLASS]">
          {{
            latestRun
              ? t("automation.scraper.latestRun.openButton")
              : t("automation.hub.viewRunsButton")
          }}
        </NuxtLink>
      </div>

      <AutomationScraperCapabilityStats
        :capability="capability"
        :run-state="runState"
        :issue-count="issueCount"
        :readiness-value-class="readinessValueClass()"
        :latest-run-value-class="latestRunValueClass()"
        :capability-availability-label="capabilityAvailabilityLabel"
        :run-state-label="runStateLabel"
        :latest-run-status-text="latestRunStatusText"
        :has-latest-run="Boolean(latestRun)"
      />

      <AutomationScraperCapabilityRunActions
        v-if="showOperations"
        :capability="capability"
        :run-state="runState"
        :run-message="runMessage"
        :pending-action="pendingAction"
        :card-run-aria="cardRunAria"
        :card-run-button-label="cardRunButtonLabel"
        :run-state-label="runStateLabel"
        :is-pending-action="isPendingAction"
        @run="emit('run', $event)"
      />

      <AutomationScraperCapabilityIssues
        :capability-id="capability.id"
        :issue-count="issueCount"
        :issues="issues"
        :compact-mode="Boolean(compactMode)"
      />

      <AutomationScraperCapabilitySchedule
        v-if="showOperations"
        :capability="capability"
        :scheduled-run-at="scheduledRunAt"
        :latest-run="latestRun"
        :pending-action="pendingAction"
        :latest-run-notice-text="latestRunNoticeText"
        :latest-run-status-text="latestRunStatusText"
        :is-pending-action="isPendingAction"
        :build-run-detail-route="buildRunDetailRoute"
        @schedule="emit('schedule', $event)"
        @update:scheduled-run-at="emit('update:scheduledRunAt', $event)"
      />
    </div>
  </div>
</template>
