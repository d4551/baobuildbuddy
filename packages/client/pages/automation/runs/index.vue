<script setup lang="ts">
import { OUTLINE_ACTION_CLASS } from "~/constants/layout";

defineOptions({ name: "AutomationRunsPage" });

definePageMeta({
  middleware: ["auth"],
});

import { APP_ROUTES } from "@bao/shared/constants/routes";
import { useI18n } from "vue-i18n";
import { useSeoMeta } from "#imports";
import { useAutomationRunsPage } from "~/composables/automation-runs-page";

const { t } = useI18n();
const {
  statusFilter,
  typeFilter,
  typeOptions,
  statusOptions,
  isLoading,
  error,
  errorMessage,
  refresh,
  sortedRuns,
  isLiveRun,
  formatRunType,
  formatRunStatus,
  formatRunProgress,
  formatDate,
  resolveRowClass,
} = useAutomationRunsPage();

useSeoMeta({
  title: t("automation.runs.title"),
  description: t("automation.hub.cards.runHistory.description"),
});
</script>

<template>
  <PageScaffold tag="section" width-token="content" labelled-by="automation-runs-title">
    <PageHeroHeader
      title-id="automation-runs-title"
      :title="t('automation.runs.title')"
      :description="t('automation.hub.cards.runHistory.description')"
    >
      <template #actions>
        <NuxtLink
          :to="APP_ROUTES.automation"
          :class="[OUTLINE_ACTION_CLASS]"
          :aria-label="t('automation.runs.backToAutomation')"
        >
          {{ t("automation.runs.backButton") }}
        </NuxtLink>
      </template>
    </PageHeroHeader>

    <AutomationRunsFilters
      v-model:type-filter="typeFilter"
      v-model:status-filter="statusFilter"
      :type-options="typeOptions"
      :status-options="statusOptions"
      :t="t"
    />

    <LoadingSkeleton v-if="isLoading && sortedRuns.length === 0" :lines="6" />

    <BootstrapErrorAlert
      v-else-if="error"
      :title="t('automation.runs.loadErrorTitle')"
      :message="errorMessage"
      :retry-label="t('automation.hub.retryButtonLabel')"
      :retry-aria-label="t('automation.hub.retryAria')"
      @retry="() => refresh()"
    />

    <AutomationRunsTable
      v-else
      :runs="sortedRuns"
      :is-loading="isLoading"
      :is-live-run="isLiveRun"
      :format-run-type="formatRunType"
      :format-run-status="formatRunStatus"
      :format-run-progress="formatRunProgress"
      :format-date="formatDate"
      :resolve-row-class="resolveRowClass"
    />
  </PageScaffold>
</template>
