<script setup lang="ts">
import type {
  RpaCapabilityAuditEntry,
  RpaCapabilityAuditReport,
} from "@bao/shared/constants/automation";
import { APP_ROUTES } from "@bao/shared/constants/routes";
import { useI18n } from "vue-i18n";
import { getErrorMessage } from "~/utils/errors";
import {
  resolveAutomationCapabilityAction,
  resolveAutomationCapabilityDisplayName,
  resolveAutomationCapabilityIssues,
} from "~/utils/automation-capabilities";

defineProps<{
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

        <div class="overflow-x-auto">
          <table
            class="table table-zebra table-sm md:table-md"
            :aria-label="t('automation.hub.audit.tableAria')"
          >
            <thead>
              <tr>
                <th scope="col">{{ t("automation.hub.audit.columns.name") }}</th>
                <th scope="col">{{ t("automation.hub.audit.columns.configured") }}</th>
                <th scope="col">{{ t("automation.hub.audit.columns.coverage") }}</th>
                <th scope="col">{{ t("automation.hub.audit.columns.issues") }}</th>
                <th scope="col">{{ t("automation.hub.audit.columns.actions") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="capability in capabilityEntries" :key="capability.id" class="align-top">
                <td class="min-w-52 whitespace-normal">
                  <div class="flex items-start gap-3">
                    <span
                      class="badge badge-outline badge-sm mt-0.5 h-8 w-8 shrink-0 justify-center p-0"
                      :title="capabilityTypeLabel(capability)"
                      :aria-label="capabilityTypeLabel(capability)"
                    >
                      <svg
                        v-if="capability.category === 'job_apply'"
                        aria-hidden="true"
                        class="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M15.75 6.75V5.625A1.875 1.875 0 0 0 13.875 3.75h-3.75A1.875 1.875 0 0 0 8.25 5.625V6.75m7.5 0h1.125A1.875 1.875 0 0 1 18.75 8.625v8.25a1.875 1.875 0 0 1-1.875 1.875H7.125A1.875 1.875 0 0 1 5.25 16.875v-8.25A1.875 1.875 0 0 1 7.125 6.75H8.25m7.5 0h-7.5"
                          stroke="currentColor"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="1.5"
                        />
                      </svg>
                      <svg
                        v-else
                        aria-hidden="true"
                        class="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M3.75 5.25h16.5M6 9.75h12M8.25 14.25h7.5m-6 4.5h4.5"
                          stroke="currentColor"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="1.5"
                        />
                      </svg>
                    </span>
                    <p class="font-medium">{{ capabilityDisplayName(capability) }}</p>
                  </div>
                </td>
                <td class="whitespace-nowrap">
                  <span
                    :class="[
                      capabilityStatusClass(capability.configured, capabilityIssueCount(capability)),
                      'whitespace-nowrap',
                    ]"
                  >
                    {{ capabilityStatusLabel(capability.configured, capabilityIssueCount(capability)) }}
                  </span>
                </td>
                <td class="min-w-40">
                  <div class="flex flex-wrap gap-2">
                    <span
                      :class="[
                        capabilityStatusClass(capability.manualRunAvailable),
                        'h-8 w-8 justify-center p-0',
                      ]"
                      :title="t('automation.hub.audit.coverage.manual')"
                      :aria-label="t('automation.hub.audit.coverage.manual')"
                    >
                      <svg aria-hidden="true" class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8.25 6.5v11l9-5.5-9-5.5Z" />
                      </svg>
                    </span>
                    <span
                      :class="[
                        capabilityStatusClass(capability.scheduledRunAvailable),
                        'h-8 w-8 justify-center p-0',
                      ]"
                      :title="t('automation.hub.audit.coverage.scheduled')"
                      :aria-label="t('automation.hub.audit.coverage.scheduled')"
                    >
                      <svg aria-hidden="true" class="h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <path
                          d="M12 6v6l3.75 2.25M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                          stroke="currentColor"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="1.5"
                        />
                      </svg>
                    </span>
                    <span
                      :class="[
                        capabilityStatusClass(capability.runHistoryAvailable),
                        'h-8 w-8 justify-center p-0',
                      ]"
                      :title="t('automation.hub.audit.coverage.history')"
                      :aria-label="t('automation.hub.audit.coverage.history')"
                    >
                      <svg aria-hidden="true" class="h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <path
                          d="M16.023 9.348h4.992v-.001M2.985 12A9 9 0 0 1 18.36 5.647M2.985 12A9 9 0 0 0 18.36 18.353M2.985 12H7.5m8.523 2.652L21.015 12M12 7.5v4.5l3 3"
                          stroke="currentColor"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="1.5"
                        />
                      </svg>
                    </span>
                    <span
                      :class="[
                        capabilityStatusClass(capability.liveUpdatesAvailable),
                        'h-8 w-8 justify-center p-0',
                      ]"
                      :title="t('automation.hub.audit.coverage.live')"
                      :aria-label="t('automation.hub.audit.coverage.live')"
                    >
                      <svg aria-hidden="true" class="h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <path
                          d="M3 12h3l2.25-6 4.5 12 2.25-6H21"
                          stroke="currentColor"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="1.5"
                        />
                      </svg>
                    </span>
                  </div>
                </td>
                <td class="min-w-44">
                  <span
                    v-if="capabilityIssueCount(capability) === 0"
                    class="badge badge-success badge-soft whitespace-nowrap"
                  >
                    {{ t("automation.hub.audit.issueState.ready") }}
                  </span>
                  <details v-else class="dropdown dropdown-end">
                    <summary
                      class="btn btn-ghost btn-sm list-none gap-2"
                      :aria-label="
                        t('automation.hub.audit.issueSummaryAria', {
                          capability: capabilityDisplayName(capability),
                          count: capabilityIssueCount(capability),
                        })
                      "
                    >
                      <svg aria-hidden="true" class="h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <path
                          d="M12 9v3.75m0 3.75h.008v.008H12V16.5Zm8.25-4.5a8.25 8.25 0 1 1-16.5 0 8.25 8.25 0 0 1 16.5 0Z"
                          stroke="currentColor"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="1.5"
                        />
                      </svg>
                      <span class="badge badge-warning badge-sm">
                        {{ capabilityIssueCount(capability) }}
                      </span>
                    </summary>
                    <div class="dropdown-content z-10 mt-2 w-72">
                      <div class="card card-border bg-base-100 shadow-xl">
                        <div class="card-body gap-3 p-4">
                          <h3 class="text-sm font-semibold">
                            {{ t("automation.hub.audit.issueState.needsAttention") }}
                          </h3>
                          <ul class="list-disc space-y-2 pl-5 text-sm text-base-content/70">
                            <li
                              v-for="(issue, issueIndex) in capabilityIssues(capability)"
                              :key="`${capability.id}-issue-${issueIndex}`"
                            >
                              {{ issue }}
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </details>
                </td>
                <td class="whitespace-nowrap">
                  <NuxtLink
                    :to="capabilityAction(capability).to"
                    class="btn btn-ghost btn-sm"
                    :aria-label="capabilityAction(capability).ariaLabel"
                  >
                    {{ capabilityAction(capability).label }}
                  </NuxtLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>
  </section>
</template>
