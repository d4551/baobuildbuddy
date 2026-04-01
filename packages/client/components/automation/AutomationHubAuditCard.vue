<script setup lang="ts">
import type {
  RpaCapabilityAuditEntry,
  RpaCapabilityAuditReport,
} from "@bao/shared/constants/automation";
import { APP_ROUTES } from "@bao/shared/constants/routes";
import { useI18n } from "vue-i18n";
import { resolveAppIconComponent } from "~/components/icons/icon-registry";
import {
  resolveAutomationCapabilityAction,
  resolveAutomationCapabilityDisplayName,
  resolveAutomationCapabilityIssues,
} from "~/utils/automation-capabilities";
import { getErrorMessage } from "~/utils/errors";
import { resolveAutomationCapabilityIconName } from "./automation-visuals";

const props = defineProps<{
  capabilityAuditStatus: "idle" | "pending" | "success" | "error";
  capabilityAuditError: unknown;
  capabilitySummary: RpaCapabilityAuditReport["summary"] | null;
  capabilityEntries: readonly RpaCapabilityAuditEntry[];
  capabilityStatusClass: (value: boolean, issueCount?: number) => string;
  capabilityStatusLabel: (value: boolean, issueCount?: number) => string;
}>();

const emit = defineEmits<{
  retry: [];
}>();

const { t } = useI18n();

const capabilityIssues = (capability: RpaCapabilityAuditEntry): string[] =>
  resolveAutomationCapabilityIssues(capability, t);

const capabilityIssueCount = (capability: RpaCapabilityAuditEntry): number =>
  capabilityIssues(capability).length;

const capabilityDisplayName = (capability: RpaCapabilityAuditEntry): string =>
  resolveAutomationCapabilityDisplayName(capability, t);

const capabilityAction = (capability: RpaCapabilityAuditEntry) =>
  resolveAutomationCapabilityAction(capability, t);

const capabilityTypeLabel = (capability: RpaCapabilityAuditEntry): string =>
  capability.category === "job_apply"
    ? t("automation.hub.audit.type.jobApply")
    : t("automation.hub.audit.type.scrape");

const capabilityIconName = (capability: RpaCapabilityAuditEntry) =>
  resolveAutomationCapabilityIconName(capability);

const needsAttentionEntries = computed(() =>
  props.capabilityEntries.filter((capability) => capabilityIssueCount(capability) > 0),
);

const readyEntries = computed(() =>
  props.capabilityEntries.filter((capability) => capabilityIssueCount(capability) === 0),
);
</script>

<template>
  <section class="card card-border bg-base-100" :aria-label="t('automation.hub.audit.aria')">
    <div class="card-body gap-4">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 class="card-title">{{ t("automation.hub.audit.title") }}</h2>
          <p class="text-sm text-base-content/70">
            {{ t("automation.hub.audit.description") }}
          </p>
        </div>
        <NuxtLink
          :to="APP_ROUTES.automationScraper"
          class="btn btn-outline btn-sm"
          :aria-label="t('automation.hub.audit.openScraperAria')"
        >
          {{ t("automation.hub.audit.openScraperButton") }}
        </NuxtLink>
      </div>

      <LoadingSkeleton
        v-if="capabilityAuditStatus === 'pending' || capabilityAuditStatus === 'idle'"
        variant="stats"
        :lines="3"
      />

      <BootstrapErrorAlert
        v-else-if="capabilityAuditStatus === 'error'"
        severity="warning"
        :message="getErrorMessage(capabilityAuditError, t('automation.hub.audit.loadErrorFallback'))"
        :retry-label="t('automation.hub.retryButtonLabel')"
        :retry-aria-label="t('automation.hub.retryAria')"
        @retry="emit('retry')"
      />

      <template v-else-if="capabilitySummary">
        <StatsRow
          background-class="border border-base-300 bg-base-200"
          :stats="[
            { titleKey: 'automation.hub.audit.summary.total', value: capabilitySummary.total, valueClass: 'text-primary', descKey: 'automation.hub.audit.summary.totalDesc' },
            { titleKey: 'automation.hub.audit.summary.configured', value: capabilitySummary.configured, valueClass: 'text-success', descKey: 'automation.hub.audit.summary.configuredDesc' },
            { titleKey: 'automation.hub.audit.summary.live', value: capabilitySummary.liveUpdatesAvailable, valueClass: 'text-secondary', descKey: 'automation.hub.audit.summary.liveDesc' },
          ]"
        />

        <SectionGrid grid-token="twoColumnWide">
          <section class="card card-border bg-base-100" aria-labelledby="automation-capability-attention-title">
            <div class="card-body gap-4">
              <div>
                <h3 id="automation-capability-attention-title" class="card-title text-lg">
                  {{ t("automation.hub.audit.groups.attentionTitle") }}
                </h3>
                <p class="text-sm text-base-content/70">
                  {{ t("automation.hub.audit.groups.attentionDescription") }}
                </p>
              </div>

              <EmptyState
                v-if="needsAttentionEntries.length === 0"
                title-key="automation.hub.audit.groups.attentionEmptyTitle"
                description-key="automation.hub.audit.groups.attentionEmptyDescription"
              />

              <div v-else class="space-y-3">
                <div
                  v-for="capability in needsAttentionEntries"
                  :key="capability.id"
                  class="rounded-box border border-base-300 bg-base-200 p-4"
                >
                  <div class="flex flex-wrap items-start justify-between gap-3">
                    <div class="space-y-2">
                      <div class="flex flex-wrap items-center gap-2">
                        <span class="tooltip tooltip-right" :data-tip="capabilityTypeLabel(capability)">
                          <span
                            class="inline-flex h-8 w-8 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary shadow-sm"
                          >
                            <component
                              :is="resolveAppIconComponent(capabilityIconName(capability))"
                              class="h-4 w-4"
                              aria-hidden="true"
                            />
                            <span class="sr-only">{{ capabilityTypeLabel(capability) }}</span>
                          </span>
                        </span>
                        <p class="font-semibold">{{ capabilityDisplayName(capability) }}</p>
                        <span
                          :class="[
                            capabilityStatusClass(capability.configured, capabilityIssueCount(capability)),
                            'whitespace-nowrap',
                          ]"
                        >
                          {{ capabilityStatusLabel(capability.configured, capabilityIssueCount(capability)) }}
                        </span>
                      </div>
                      <span class="badge badge-ghost badge-sm">{{ capabilityTypeLabel(capability) }}</span>
                      <AutomationCoverageChips
                        :manual-run-available="capability.manualRunAvailable"
                        :scheduled-run-available="capability.scheduledRunAvailable"
                        :run-history-available="capability.runHistoryAvailable"
                        :live-updates-available="capability.liveUpdatesAvailable"
                      />
                      <ul class="space-y-1 text-sm text-base-content/80">
                        <li
                          v-for="(issue, issueIndex) in capabilityIssues(capability)"
                          :key="`${capability.id}-issue-detail-${issueIndex}`"
                        >
                          {{ issue }}
                        </li>
                      </ul>
                    </div>

                    <NuxtLink
                      :to="capabilityAction(capability).to"
                      class="btn btn-outline btn-sm"
                      :aria-label="capabilityAction(capability).ariaLabel"
                    >
                      {{ capabilityAction(capability).label }}
                    </NuxtLink>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section class="card card-border bg-base-100" aria-labelledby="automation-capability-ready-title">
            <div class="card-body gap-4">
              <div>
                <h3 id="automation-capability-ready-title" class="card-title text-lg">
                  {{ t("automation.hub.audit.groups.readyTitle") }}
                </h3>
                <p class="text-sm text-base-content/70">
                  {{ t("automation.hub.audit.groups.readyDescription") }}
                </p>
              </div>

              <div class="space-y-3">
                <div
                  v-for="capability in readyEntries"
                  :key="capability.id"
                  class="rounded-box border border-base-300 bg-base-200 p-4"
                >
                  <div class="flex flex-wrap items-start justify-between gap-3">
                    <div class="space-y-2">
                      <div class="flex flex-wrap items-center gap-2">
                        <span class="tooltip tooltip-right" :data-tip="capabilityTypeLabel(capability)">
                          <span
                            class="inline-flex h-8 w-8 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary shadow-sm"
                          >
                            <component
                              :is="resolveAppIconComponent(capabilityIconName(capability))"
                              class="h-4 w-4"
                              aria-hidden="true"
                            />
                            <span class="sr-only">{{ capabilityTypeLabel(capability) }}</span>
                          </span>
                        </span>
                        <p class="font-semibold">{{ capabilityDisplayName(capability) }}</p>
                        <span class="badge badge-success badge-soft whitespace-nowrap">
                          {{ t("automation.hub.audit.issueState.ready") }}
                        </span>
                      </div>
                      <span class="badge badge-ghost badge-sm">{{ capabilityTypeLabel(capability) }}</span>
                      <AutomationCoverageChips
                        :manual-run-available="capability.manualRunAvailable"
                        :scheduled-run-available="capability.scheduledRunAvailable"
                        :run-history-available="capability.runHistoryAvailable"
                        :live-updates-available="capability.liveUpdatesAvailable"
                      />
                    </div>

                    <NuxtLink
                      :to="capabilityAction(capability).to"
                      class="btn btn-ghost btn-sm"
                      :aria-label="capabilityAction(capability).ariaLabel"
                    >
                      {{ capabilityAction(capability).label }}
                    </NuxtLink>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </SectionGrid>
      </template>
    </div>
  </section>
</template>
