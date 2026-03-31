<script setup lang="ts">
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const page = useAutomationJobApplyPage();

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

    <AutomationJobApplyFormCard
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
