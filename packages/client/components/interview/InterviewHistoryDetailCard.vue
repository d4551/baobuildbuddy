<script setup lang="ts">
import type { InterviewSession } from "@bao/shared";
import { useI18n } from "vue-i18n";
import CloseIcon from "~/components/ui/CloseIcon.vue";

defineProps<{
  detailError: string;
  detailLoading: boolean;
  selectedSession: InterviewSession | null;
  formatScore: (value: number | undefined) => string;
  questionScoreText: (value: number | undefined) => number;
  getScoreColorClass: (value: number | undefined) => string;
}>();

const emit = defineEmits<{
  retry: [];
  close: [];
}>();

const { t } = useI18n();
</script>

<template>
  <div>
    <BootstrapErrorAlert
      v-if="detailError"
      :message="detailError"
      :retry-label="t('interviewHistory.retryButtonLabel')"
      :retry-aria-label="t('interviewHistory.retryAria')"
      @retry="emit('retry')"
    />

    <div v-if="detailLoading" class="card bg-base-200">
      <div class="card-body">
        <p role="status" aria-live="polite">{{ t("interviewHistory.loadingDetails") }}</p>
      </div>
    </div>

    <div v-else-if="selectedSession" class="card bg-base-200 sticky top-6">
      <div class="card-body">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="card-title text-lg">{{ t("interviewHistory.detailsTitle") }}</h3>
          <button
            type="button"
            class="btn btn-ghost btn-xs btn-circle"
            :aria-label="t('interviewHistory.closeDetailsAria')"
            @click="emit('close')"
          >
            <CloseIcon class="h-4 w-4" />
          </button>
        </div>

        <div class="space-y-4">
          <div>
            <p class="text-xs text-base-content/60">{{ t("interviewHistory.detailStudioLabel") }}</p>
            <p class="font-semibold">{{ selectedSession.studioName }}</p>
          </div>

          <div>
            <p class="text-xs text-base-content/60">{{ t("interviewHistory.detailRoleLabel") }}</p>
            <p class="font-semibold">{{ selectedSession.role }}</p>
          </div>

          <div>
            <p class="text-xs text-base-content/60">{{ t("interviewHistory.detailScoreLabel") }}</p>
            <div class="flex items-center gap-2">
              <div
                class="radial-progress"
                :class="getScoreColorClass(selectedSession.score ?? 0)"
                :style="{ '--value': selectedSession.score ?? 0, '--size': '3rem' }"
                role="progressbar"
                :aria-label="t('interviewHistory.detailScoreAria', { score: selectedSession.score ?? 0 })"
                :aria-valuenow="selectedSession.score ?? 0"
                aria-valuemin="0"
                aria-valuemax="100"
              >
                <span class="text-sm font-bold">{{ formatScore(selectedSession.score) }}</span>
              </div>
            </div>
          </div>

          <div>
            <p class="mb-2 text-xs text-base-content/60">{{ t("interviewHistory.questionsLabel") }}</p>
            <div class="space-y-2">
              <div
                v-for="(question, idx) in selectedSession.questions"
                :key="idx"
                class="collapse collapse-arrow bg-base-100"
              >
                <input
                  type="radio"
                  :name="`question-${selectedSession.id}`"
                  :aria-label="t('interviewHistory.questionAria', { index: idx + 1 })"
                />
                <div class="collapse-title text-sm font-medium">
                  {{
                    t("interviewHistory.questionHeader", {
                      index: idx + 1,
                      score: questionScoreText(question.score),
                    })
                  }}
                </div>
                <div class="collapse-content text-xs">
                  <p class="mb-1 font-semibold">{{ question.question }}</p>
                  <p class="mb-2 text-base-content/60">{{ question.response }}</p>
                  <p class="text-base-content/80">{{ question.feedback }}</p>
                </div>
              </div>
            </div>
          </div>

          <div v-if="selectedSession.overallFeedback">
            <p class="mb-1 text-xs text-base-content/60">
              {{ t("interviewHistory.overallFeedbackLabel") }}
            </p>
            <p class="text-sm">{{ selectedSession.overallFeedback }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="card bg-base-200">
      <div class="card-body">
        <EmptyState
          title-key="interviewHistory.selectPromptTitle"
          description-key="interviewHistory.selectPromptDescription"
        />
      </div>
    </div>
  </div>
</template>
