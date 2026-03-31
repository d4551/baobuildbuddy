<script setup lang="ts">
import { APP_ROUTES } from "@bao/shared/constants/routes";
import { useAutomationRunDetailPage } from "~/composables/useAutomationRunDetailPage";

const {
  t,
  run,
  breadcrumbs,
  streamError,
  streamStateMessageKey,
  showLoadError,
  canRetryLoad,
  inputSummary,
  outputSummary,
  statusText,
  progressPercent,
  timelineEntries,
  formattedInput,
  formattedOutput,
  screenshotPaths,
  toLocalizedDateTime,
  screenshotEndpoint,
  screenshotLinkLabel,
  markScreenshotError,
  screenshotHasError,
  retryRunStream,
} = useAutomationRunDetailPage();

if (import.meta.server) {
  useServerSeoMeta({
    title: t("automation.runDetail.title"),
    description: t("automation.hub.cards.runHistory.description"),
  });
}
</script>

<template>
  <PageScaffold tag="section" width-token="content" labelled-by="automation-run-detail-title">
    <div class="space-y-3">
      <AppBreadcrumbs :crumbs="breadcrumbs" />
      <PageHeroHeader title-id="automation-run-detail-title" :title="t('automation.runDetail.title')">
        <template #actions>
          <NuxtLink
            :to="APP_ROUTES.automationRuns"
            class="btn btn-outline"
            :aria-label="t('automation.runDetail.backToRunsAria')"
          >
            {{ t("automation.runDetail.backButton") }}
          </NuxtLink>
        </template>
      </PageHeroHeader>
    </div>

    <BootstrapErrorAlert
      v-if="showLoadError"
      :title="t('automation.runDetail.loadErrorTitle')"
      :message="streamError?.message || t(streamStateMessageKey)"
      :retry-label="canRetryLoad ? t('automation.runDetail.retryButton') : ''"
      :retry-aria-label="canRetryLoad ? t('automation.runDetail.retryAria') : ''"
      @retry="retryRunStream"
    />

    <div v-if="run" class="space-y-6">
      <AutomationRunDetailStatsCard
        :input-summary="inputSummary"
        :output-summary="outputSummary"
        :status-text="statusText"
        :progress-percent="progressPercent"
        :error-message="
          run.error ? (typeof run.error === 'string' ? run.error : run.error.message) : ''
        "
      />

      <AutomationRunDetailTimelineCard
        :timeline-entries="timelineEntries"
        :to-localized-date-time="toLocalizedDateTime"
      />

      <AutomationRunDetailPayloadGrid
        :formatted-input="formattedInput"
        :formatted-output="formattedOutput"
      />

      <AutomationRunDetailScreenshotsCard
        :screenshot-paths="screenshotPaths"
        :screenshot-endpoint="screenshotEndpoint"
        :screenshot-link-label="screenshotLinkLabel"
        :screenshot-has-error="screenshotHasError"
        :mark-screenshot-error="markScreenshotError"
      />
    </div>

    <LoadingSkeleton v-else :lines="8" />
  </PageScaffold>
</template>
