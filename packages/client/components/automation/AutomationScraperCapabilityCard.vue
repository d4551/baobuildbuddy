<script setup lang="ts">
import type { AutomationScrapeTarget } from "@bao/shared/constants/automation";
import { APP_ROUTE_BUILDERS } from "@bao/shared/constants/routes";
import { useI18n } from "vue-i18n";
import { resolveAppIconComponent } from "~/components/icons/icon-registry";
import {
  BADGE_SM_CLASS,
  BADGE_SOFT_SM_CLASS,
  FLEX_GAP_TOKEN_CLASS,
  FLUID_HEIGHT_CLASS,
  FLUID_WIDTH_CLASS,
  GHOST_ACTION_DENSE_CLASS,
  ICON_SIZE_CLASS,
  INSET_PANEL_MUTED_CLASS,
  OUTLINE_ACTION_CLASS,
  PADDING_TOKEN_CLASS,
  PRIMARY_ACTION_CLASS,
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
const jobIntelligenceSettingsRoute = APP_ROUTE_BUILDERS.settingsSection("jobIntelligence");

const issues = computed(() => resolveAutomationCapabilityIssues(props.capability, t));
const issueCount = computed(() => issues.value.length);
const capabilityIconName = computed(() => SCRAPE_TARGET_ICON_NAMES[props.capability.target]);
const latestRunRoute = computed(() =>
  props.latestRun ? props.buildRunDetailRoute(props.latestRun.id) : props.automationRunsRoute,
);
const showOperations = computed(() => !props.compactMode);

function handleScheduleInput(event: Event): void {
  const input = event.target;
  if (input instanceof HTMLInputElement) {
    emit("update:scheduledRunAt", { target: props.capability.target, value: input.value });
  }
}
</script>

<template>
  <div :class="[SURFACE_GLASS_CARD_CLASS, FLUID_HEIGHT_CLASS]">
    <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap4]">
      <div class="flex flex-wrap items-start justify-between" :class="[FLEX_GAP_TOKEN_CLASS.gap3]">
        <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack2]">
          <div class="flex flex-wrap items-center" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
            <span class="tooltip tooltip-bottom" :data-tip="capability.name">
              <span class="inline-flex items-center justify-center border border-primary/30 bg-primary/10 text-primary" :class="[RADIUS_TOKEN_CLASS.full, ICON_SIZE_CLASS[8]]">
                <component :class="[ICON_SIZE_CLASS[4]]" :is="resolveAppIconComponent(capabilityIconName)" aria-hidden="true"/>
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

      <div class="stats stats-vertical border border-base-300 bg-base-200 xl:stats-horizontal" :class="[FLUID_WIDTH_CLASS]">
        <div class="stat">
          <div class="stat-title">{{ t("automation.scraper.providerCard.readinessTitle") }}</div>
          <div 
            class="stat-value" :class="[TYPOGRAPHY_SCALE_CLASS.xl2, capability.configured ? 'text-success' : issueCount > 0 ? 'text-warning' : 'text-error']"
          >
            {{ capabilityAvailabilityLabel(capability) }}
          </div>
          <div class="stat-desc">
            {{ t("automation.scraper.providerCard.readinessDescription") }}
          </div>
        </div>
        <div class="stat">
          <div class="stat-title">{{ t("automation.scraper.providerCard.issuesTitle") }}</div>
          <div class="stat-value" :class="[TYPOGRAPHY_SCALE_CLASS.xl2, issueCount === 0 ? 'text-success' : 'text-warning']">
            {{ issueCount }}
          </div>
          <div class="stat-desc">
            {{
              issueCount === 0
                ? t("automation.scraper.providerCard.issuesReady")
                : t("automation.scraper.providerCard.issuesNeedsAttention")
            }}
          </div>
        </div>
        <div class="stat">
          <div class="stat-title">{{ t("automation.scraper.providerCard.latestRunTitle") }}</div>
          <div class="stat-value" :class="[TYPOGRAPHY_SCALE_CLASS.xl2, runState === 'success' ? 'text-success' : runState === 'error' ? 'text-error' : runState === 'running' ? 'text-info' : 'text-base-content']">
            {{ runStateLabel(runState) }}
          </div>
          <div class="stat-desc">
            {{
              latestRun
                ? latestRunStatusText(capability.target)
                : t("automation.scraper.providerCard.latestRunDescription")
            }}
          </div>
        </div>
      </div>

      <div v-if="showOperations" class="card-actions justify-end" :class="[FLEX_GAP_TOKEN_CLASS.gap3]">
        <button 
          :class="[PRIMARY_ACTION_CLASS]"
          :aria-label="cardRunAria(capability.target)"
          :disabled="pendingAction !== null || !capability.configured"
          @click="emit('run', capability.target)"
        >
          <LoadingSpinner v-if="isPendingAction(capability.target, 'run')" size="xs" :label="t('common.loading')" />
          <span>{{ cardRunButtonLabel(capability.target) }}</span>
        </button>
      </div>

      <div v-if="showOperations && runState !== 'idle'" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack3]">
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

      <div
        v-if="issueCount > 0 && compactMode"
 class="text-secondary" :class="[INSET_PANEL_MUTED_CLASS, PADDING_TOKEN_CLASS.p4, TYPOGRAPHY_SCALE_CLASS.sm]"
 >
        <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4]">
          <p class="font-semibold text-base-content">
            {{ t("automation.scraper.providerCard.setupTitle", { count: issueCount }) }}
          </p>
          <ul :class="[STACK_SPACE_Y_TOKEN_CLASS.stack2]">
            <li v-for="(issue, issueIndex) in issues" :key="`${capability.id}-issue-${issueIndex}`">
              {{ issue }}
            </li>
          </ul>
          <div class="card-actions justify-end">
            <NuxtLink :to="jobIntelligenceSettingsRoute" :class="[PRIMARY_ACTION_CLASS]">
              {{ t("automation.hub.audit.actions.fixSetup") }}
            </NuxtLink>
          </div>
        </div>
      </div>

      <details
        v-else-if="issueCount > 0"
        :class="[INSET_PANEL_MUTED_CLASS, 'collapse collapse-arrow']"
      >
        <summary class="collapse-title text-base font-semibold">
          {{ t("automation.scraper.providerCard.setupTitle", { count: issueCount }) }}
        </summary>
        <div class="collapse-content text-secondary" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4, TYPOGRAPHY_SCALE_CLASS.sm]">
          <ul :class="[STACK_SPACE_Y_TOKEN_CLASS.stack2]">
            <li v-for="(issue, issueIndex) in issues" :key="`${capability.id}-issue-${issueIndex}`">
              {{ issue }}
            </li>
          </ul>
          <div class="card-actions justify-end">
            <NuxtLink :to="jobIntelligenceSettingsRoute" :class="[PRIMARY_ACTION_CLASS]">
              {{ t("automation.hub.audit.actions.fixSetup") }}
            </NuxtLink>
          </div>
        </div>
      </details>

      <details 
        v-if="showOperations"
        :class="[INSET_PANEL_MUTED_CLASS, 'collapse collapse-arrow']"
      >
        <summary class="collapse-title text-base font-semibold">
          {{ t("automation.scraper.schedule.disclosureTitle") }}
        </summary>
        <div class="collapse-content" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4]">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("automation.scraper.schedule.legend") }}</legend>
            <input 
              :value="scheduledRunAt"
              class="input" :class="[FLUID_WIDTH_CLASS]"
              type="datetime-local"
              :aria-label="t('automation.scraper.schedule.aria')"
              @input="handleScheduleInput"
            />
            <p class="label">{{ t("automation.scraper.schedule.hint") }}</p>
          </fieldset>
          <div class="card-actions justify-end">
            <button 
              :class="[OUTLINE_ACTION_CLASS]"
              :aria-label="t('automation.scraper.schedule.buttonAria')"
              :disabled="pendingAction !== null || !capability.configured || !scheduledRunAt"
              @click="emit('schedule', capability.target)"
            >
              <LoadingSpinner v-if="isPendingAction(capability.target, 'schedule')" size="xs" :label="t('common.loading')" />
              <span>{{ t("automation.scraper.schedule.button") }}</span>
            </button>
          </div>
        </div>
      </details>

      <details 
        v-if="showOperations && latestRun"
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
    </div>
  </div>
</template>
