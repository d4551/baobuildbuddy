<script setup lang="ts">
definePageMeta({
  middleware: ["auth"],
});

import { APP_ROUTES } from "@bao/shared/constants/routes";
import { useI18n } from "vue-i18n";
import { getErrorMessage } from "~/utils/errors";

const { t } = useI18n();
const page = useAutomationJobApplyPage();

const hasResumes = computed(() => (page.resumesData.value?.length ?? 0) > 0);

useSeoMeta({
  title: t("automation.jobApply.title"),
  description: t("automation.hub.cards.jobApply.description"),
});
</script>

<template>
  <PageScaffold tag="section" width-token="content" labelled-by="automation-job-apply-title">
    <PageHeroHeader
      title-id="automation-job-apply-title"
      :title="t('automation.jobApply.title')"
      :description="t('automation.hub.cards.jobApply.description')"
    />

    <LoadingSkeleton v-if="page.bootstrapPending.value" :lines="5" />

    <BootstrapErrorAlert
      v-else-if="page.bootstrapError.value"
      :title="t('automation.jobApply.bootstrapError')"
      :message="getErrorMessage(page.bootstrapError.value, t('automation.jobApply.bootstrapError'))"
      :retry-label="t('automation.jobApply.bootstrapRetry')"
      :retry-aria-label="t('automation.jobApply.bootstrapRetryAria')"
      @retry="page.refreshBootstrap()"
    />

    <EmptyState
      v-else-if="!hasResumes"
      title-key="automation.jobApply.emptyResumesTitle"
      description-key="automation.jobApply.emptyResumesDescription"
      cta-label-key="automation.jobApply.emptyResumesCta"
      cta-aria-key="automation.jobApply.emptyResumesCtaAria"
      :cta-to="APP_ROUTES.resume"
    />

    <AutomationJobApplyFormCard
      v-else
      v-model:job-url="page.jobUrl.value"
      v-model:resume-id="page.resumeId.value"
      v-model:cover-letter-id="page.coverLetterId.value"
      v-model:job-id="page.jobId.value"
      v-model:run-at="page.runAt.value"
      :resumes="page.resumesData.value || []"
      :cover-letters="page.coverLettersData.value || []"
      :pending="page.pending.value"
      :is-submit-disabled="page.isSubmitDisabled.value"
      :is-schedule-disabled="page.isScheduleDisabled.value"
      @submit="page.submitJobApply"
      @schedule="page.submitScheduledJobApply"
    />

    <BootstrapErrorAlert
      v-if="page.submitError.value"
      :title="t('automation.jobApply.submitErrorTitle')"
      :message="page.submitError.value"
    />

    <AutomationJobApplyRunCard
      v-if="page.hasActiveRun.value"
      :active-run-id="page.activeRunId.value"
      :run="page.streamRun.value"
      :stream-state="page.streamState.value"
      :stream-error-message="page.streamError.value?.message || ''"
      :event-rows="[...page.streamEvents.value].slice(-12).reverse()"
      :to-localized-date-time="page.toLocalizedDateTime"
      :run-detail-route="page.runDetailRoute"
      @retry="page.runStream.retry"
      @cancel="page.runStream.cancel"
    />

    <AutomationJobApplyScheduledCard
      v-if="page.scheduledRun.value"
      :run="page.scheduledRun.value"
      :resolve-scheduled-run-at="page.resolveScheduledRunAt"
      :to-localized-date-time="page.toLocalizedDateTime"
      :run-detail-route="page.runDetailRoute"
    />
  </PageScaffold>
</template>
