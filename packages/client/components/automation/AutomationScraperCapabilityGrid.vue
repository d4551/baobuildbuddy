<script setup lang="ts">
import type { AutomationScrapeTarget } from "@bao/shared/constants/automation";
import { useI18n } from "vue-i18n";
import type {
  AutomationRunEnvelope,
  AutomationScraperRunState,
  ScrapeCapabilityCard,
  ScrapePendingAction,
  TargetRecord,
} from "~/types/automation-scraper";

defineProps<{
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

function handleScheduleInput(target: AutomationScrapeTarget, event: Event): void {
  const input = event.target;
  if (input instanceof HTMLInputElement) {
    emit("update:scheduledRunAt", target, input.value);
  }
}
</script>

<template>
  <SectionGrid grid-token="twoColumnXl">
    <div
      v-for="capability in capabilities"
      :key="capability.id"
      class="card card-border rounded-box border border-base-300 bg-base-100 shadow-sm"
    >
      <div class="card-body gap-4">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="space-y-2">
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="card-title">{{ capability.name }}</h2>
              <span class="badge badge-soft badge-sm" :class="capabilityAvailabilityBadgeClass(capability)">
                {{ capabilityAvailabilityLabel(capability) }}
              </span>
              <span class="badge badge-sm" :class="runStateBadgeClass(runStates[capability.target])">
                {{ runStateLabel(runStates[capability.target]) }}
              </span>
            </div>
            <div class="flex flex-wrap gap-2 text-xs">
              <span class="badge badge-outline badge-sm">
                {{ t("automation.hub.audit.columns.manual") }}
              </span>
              <span class="badge badge-outline badge-sm">
                {{ t("automation.hub.audit.columns.scheduled") }}
              </span>
              <span class="badge badge-outline badge-sm">
                {{ t("automation.hub.audit.columns.history") }}
              </span>
              <span class="badge badge-outline badge-sm">
                {{ t("automation.hub.audit.columns.live") }}
              </span>
            </div>
          </div>
          <NuxtLink :to="automationRunsRoute" class="btn btn-ghost btn-sm">
            {{ t("automation.hub.viewRunsButton") }}
          </NuxtLink>
        </div>

        <p class="text-sm text-base-content/70">
          {{ cardDescription(capability.target) }}
        </p>

        <div v-if="capability.issues.length > 0" role="alert" class="alert alert-warning alert-soft">
          <div class="space-y-1">
            <p class="font-medium">{{ capabilityAvailabilityLabel(capability) }}</p>
            <ul class="space-y-1 text-sm">
              <li v-for="issue in capability.issues" :key="issue">
                {{ issue }}
              </li>
            </ul>
          </div>
        </div>

        <fieldset class="fieldset rounded-box border border-base-300 bg-base-200/50 p-4">
          <legend class="fieldset-legend">{{ t("automation.scraper.schedule.legend") }}</legend>
          <input
            :value="scheduledRunAt[capability.target]"
            class="input w-full"
            type="datetime-local"
            :aria-label="t('automation.scraper.schedule.aria')"
            @input="handleScheduleInput(capability.target, $event)"
          />
          <p class="label">{{ t("automation.scraper.schedule.hint") }}</p>
        </fieldset>

        <div class="card-actions justify-end gap-3">
          <button
            class="btn btn-primary"
            :aria-label="cardRunAria(capability.target)"
            :disabled="pendingAction !== null || !capability.configured"
            @click="emit('run', capability.target)"
          >
            <span v-if="isPendingAction(capability.target, 'run')" class="loading loading-spinner loading-xs"></span>
            <span>{{ cardRunButtonLabel(capability.target) }}</span>
          </button>
          <button
            class="btn btn-outline"
            :aria-label="t('automation.scraper.schedule.buttonAria')"
            :disabled="pendingAction !== null || !capability.configured || !scheduledRunAt[capability.target]"
            @click="emit('schedule', capability.target)"
          >
            <span v-if="isPendingAction(capability.target, 'schedule')" class="loading loading-spinner loading-xs"></span>
            <span>{{ t("automation.scraper.schedule.button") }}</span>
          </button>
        </div>

        <div v-if="runStates[capability.target] !== 'idle'" class="mt-2">
          <div
            v-if="runStates[capability.target] === 'running'"
            aria-live="polite"
            class="alert alert-info alert-vertical sm:alert-horizontal"
          >
            <span class="loading loading-spinner loading-xs"></span>
            <span>{{ runStateLabel(runStates[capability.target]) }}</span>
          </div>
          <div
            v-else-if="runStates[capability.target] === 'success'"
            role="alert"
            class="alert alert-success alert-vertical sm:alert-horizontal"
          >
            <span>{{ runMessages[capability.target] }}</span>
          </div>
          <div
            v-else-if="runStates[capability.target] === 'error'"
            role="alert"
            class="alert alert-error alert-vertical sm:alert-horizontal"
          >
            <span>{{ runMessages[capability.target] }}</span>
          </div>
        </div>

        <div
          v-if="latestRuns[capability.target]"
          role="alert"
          class="alert alert-info alert-vertical gap-3 sm:alert-horizontal"
        >
          <div class="space-y-1">
            <p class="font-medium">
              {{ latestRunNoticeText(capability.target) }}
            </p>
            <p class="text-sm">
              {{ latestRunStatusText(capability.target) }}
            </p>
          </div>
          <NuxtLink
            :to="buildRunDetailRoute(latestRuns[capability.target]?.id ?? '')"
            class="btn btn-ghost btn-sm"
            :aria-label="t('automation.scraper.openRunDetailAria', { id: latestRuns[capability.target]?.id ?? '' })"
          >
            {{ t("automation.scraper.openRunDetailButton") }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </SectionGrid>
</template>
