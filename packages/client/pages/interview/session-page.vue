<script setup lang="ts">
import { APP_ROUTES } from "@bao/shared/constants/routes";
import {
  LOADING_SKELETON_LINES,
} from "~/constants/numeric-ui";

defineOptions({ name: "PagesInterviewSessionPage" });

definePageMeta({
  path: APP_ROUTES.interviewSession,
  middleware: ["auth"],
});

import { useI18n } from "vue-i18n";

const { t } = useI18n();
const page = useInterviewSessionPage();

useSeoMeta({
  title: t("interviewSession.title"),
  description: t("interviewHub.seoDescription"),
});
</script>

<template>
  <PageScaffold labelled-by="interview-session-page-title">
    <PageHeaderBlock
      title-id="interview-session-page-title"
      :title="t('interviewSession.title')"
      :description="t('interviewSession.subtitle')"
    />

    <LoadingSkeleton v-if="page.completionState.value === 'loading'" :lines="LOADING_SKELETON_LINES.form" />

    <BootstrapErrorAlert
      v-else-if="page.completionState.value === 'error'"
      :title="t('interviewSession.loadErrorTitle')"
      :message="page.sessionLoadError.value"
      :retry-label="t('interviewSession.retryButtonLabel')"
      :retry-aria-label="t('interviewSession.retryAriaLabel')"
      @retry="page.retryLoadSession"
    />

    <InterviewSessionContent
      v-else-if="page.activeSession.value"
      :active-session="page.activeSession.value"
      :session-id="page.sessionId.value"
      :completion-state="page.completionState.value"
      :target-job="page.targetJob.value"
      :progress="page.progress.value"
      :elapsed-time-duration="page.elapsedTimeDuration.value"
      :elapsed-time-text="page.elapsedTimeText.value"
      :elapsed-time-aria-label="page.elapsedTimeAriaLabel.value"
      :chat-questions="page.chatQuestions.value"
      :chat-responses="page.chatResponses.value"
      :current-question-index="page.currentQuestionIndex.value"
      :current-question="page.currentQuestion.value"
      :chat-submit-hint="page.chatSubmitHint.value"
      :submit-button-label-key="page.submitButtonLabelKey.value"
      :response="page.response.value"
      :submitting="page.submitting.value"
      :completing="page.completing.value"
      :can-complete="page.canComplete.value"
      :can-use-voice="page.canUseVoice.value"
      :session-progress-label="page.sessionProgressLabel.value"
      :get-alert-class="page.getAlertClass"
      :stt="page.stt"
      @update:response="page.response.value = $event"
      @submit="page.handleSubmitResponse"
      @complete="page.handleCompleteInterview"
      @history="page.goToHistory"
    />

    <EmptyState
      v-else
      title-key="interviewSession.notFoundTitle"
      description-key="interviewSession.notFoundDescription"
      cta-label-key="interviewSession.emptyStateCta"
      cta-aria-key="interviewSession.emptyStateCtaAria"
      :cta-to="APP_ROUTES.interview"
    />
  </PageScaffold>
</template>