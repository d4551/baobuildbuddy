<script setup lang="ts">
import {
  STACK_SPACE_Y_TOKEN_CLASS,
  OUTLINE_ACTION_CLASS,
} from "~/constants/layout";

definePageMeta({
  middleware: ["auth"],
});

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

useSeoMeta({
  title: t("automation.runDetail.title"),
  description: t("automation.hub.cards.runHistory.description"),
});
</script>

<template>
  <PageScaffold tag="section" width-token="content" labelled-by="automation-run-detail-title">
    <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack3]">
      <AppBreadcrumbs :crumbs="breadcrumbs" />
      <PageHeroHeader title-id="automation-run-detail-title" :title="t('automation.runDetail.title')">
        <template #actions>
          <NuxtLink
            :to="APP_ROUTES.automationRuns"
            :class="[OUTLINE_ACTION_CLASS]"
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

    <div v-if="run" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack6]">
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
