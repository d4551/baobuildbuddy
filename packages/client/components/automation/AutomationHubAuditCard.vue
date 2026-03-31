<script setup lang="ts">
import type {
  RpaCapabilityAuditEntry,
  RpaCapabilityAuditReport,
} from "@bao/shared/constants/automation";
import { APP_ROUTES } from "@bao/shared/constants/routes";
import { useI18n } from "vue-i18n";
import { getErrorMessage } from "~/utils/errors";
import { resolveAutomationCapabilityIssues } from "~/utils/automation-capabilities";

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
  resolveAutomationCapabilityIssues(capability);

const capabilityIssueCount = (capability: RpaCapabilityAuditEntry): number =>
  capabilityIssues(capability).length;
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
                <th scope="col">{{ t("automation.hub.audit.columns.category") }}</th>
                <th scope="col">{{ t("automation.hub.audit.columns.configured") }}</th>
                <th scope="col">{{ t("automation.hub.audit.columns.manual") }}</th>
                <th scope="col">{{ t("automation.hub.audit.columns.scheduled") }}</th>
                <th scope="col">{{ t("automation.hub.audit.columns.history") }}</th>
                <th scope="col">{{ t("automation.hub.audit.columns.live") }}</th>
                <th scope="col">{{ t("automation.hub.audit.columns.notes") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="capability in capabilityEntries"
                :key="capability.id"
                class="align-top"
              >
                <td class="min-w-40 whitespace-normal font-medium">
                  {{ capability.name }}
                </td>
                <td class="min-w-32">
                  <span
                    class="badge badge-outline h-auto whitespace-normal px-3 py-2 text-center leading-tight"
                  >
                    {{ t(`automation.hub.audit.category.${capability.category}`) }}
                  </span>
                </td>
                <td>
                  <span
                    :class="[
                      capabilityStatusClass(capability.configured, capabilityIssueCount(capability)),
                      'whitespace-nowrap',
                    ]"
                  >
                    {{ capabilityStatusLabel(capability.configured, capabilityIssueCount(capability)) }}
                  </span>
                </td>
                <td>
                  <span
                    :class="[
                      capabilityStatusClass(capability.manualRunAvailable),
                      'whitespace-nowrap',
                    ]"
                  >
                    {{ capabilityStatusLabel(capability.manualRunAvailable) }}
                  </span>
                </td>
                <td>
                  <span
                    :class="[
                      capabilityStatusClass(capability.scheduledRunAvailable),
                      'whitespace-nowrap',
                    ]"
                  >
                    {{ capabilityStatusLabel(capability.scheduledRunAvailable) }}
                  </span>
                </td>
                <td>
                  <span
                    :class="[
                      capabilityStatusClass(capability.runHistoryAvailable),
                      'whitespace-nowrap',
                    ]"
                  >
                    {{ capabilityStatusLabel(capability.runHistoryAvailable) }}
                  </span>
                </td>
                <td>
                  <span
                    :class="[
                      capabilityStatusClass(capability.liveUpdatesAvailable),
                      'whitespace-nowrap',
                    ]"
                  >
                    {{ capabilityStatusLabel(capability.liveUpdatesAvailable) }}
                  </span>
                </td>
                <td class="max-w-xs whitespace-normal break-words text-sm text-base-content/70">
                  {{ capabilityIssues(capability)[0] || t("automation.hub.audit.noIssues") }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>
  </section>
</template>
