<script setup lang="ts">
import { useI18n } from "vue-i18n";
import {
  FLEX_GAP_TOKEN_CLASS,
  MARGIN_TOKEN_CLASS,
  PADDING_TOKEN_CLASS,
  POINTER_EVENTS_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  TOUCH_TARGET_MIN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

defineProps<{
  selectedJob: { title: string; company?: string } | null;
  selectedStudioName: string | null;
}>();

const emit = defineEmits<{
  openJob: [];
  openStudio: [];
}>();

const { t } = useI18n();
</script>

<template>
  <SectionGrid grid-token="twoColumnWide">
    <UiGlassCard variant="standard" :stagger-index="1">
      <div class="card-body">
        <div class="flex items-center justify-between" :class="[FLEX_GAP_TOKEN_CLASS.gap3]">
          <h2 class="card-title">{{ t("interviewHub.cards.jobPracticeTitle") }}</h2>
          <span class="badge badge-primary badge-outline">{{ t("interviewHub.cards.recommendedBadge") }}</span>
        </div>
        <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
          {{ t("interviewHub.cards.jobPracticeDescription") }}
        </p>
        <div
          v-if="selectedJob"
          class="rounded-box border border-base-300 bg-base-100"
          :class="[MARGIN_TOKEN_CLASS.mt2, PADDING_TOKEN_CLASS.p3, STACK_SPACE_Y_TOKEN_CLASS.stack2]"
        >
          <div class="flex items-start justify-between" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
            <div>
              <h3 class="font-semibold">{{ t("interviewHub.cards.selectedJobTitle") }}</h3>
              <div :class="[TYPOGRAPHY_SCALE_CLASS.xs]">
                {{
                  t("interviewHub.cards.selectedJobValue", {
                    title: selectedJob.title,
                    company: selectedJob.company,
                  })
                }}
              </div>
            </div>
            <button
              :class="[TOUCH_TARGET_MIN_CLASS, 'btn btn-sm btn-ghost', POINTER_EVENTS_TOKEN_CLASS.auto]"
              :aria-label="t('interviewHub.cards.changeJobAria')"
              @click="emit('openJob')"
            >
              {{ t("interviewHub.cards.changeButton") }}
            </button>
          </div>
        </div>
        <div class="card-actions justify-end" :class="[POINTER_EVENTS_TOKEN_CLASS.auto]">
          <button
            class="btn btn-outline"
            :class="[TOUCH_TARGET_MIN_CLASS]"
            :aria-label="t('interviewHub.cards.configureJobAria')"
            @click="emit('openJob')"
          >
            {{ t("interviewHub.cards.configureJobButton") }}
          </button>
        </div>
      </div>
    </UiGlassCard>

    <UiGlassCard variant="standard" :stagger-index="2">
      <div class="card-body">
        <h2 class="card-title">{{ t("interviewHub.cards.studioDrillTitle") }}</h2>
        <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
          {{ t("interviewHub.cards.studioDrillDescription") }}
        </p>
        <div
          v-if="selectedStudioName"
          class="rounded-box border border-base-300 bg-base-100"
          :class="[MARGIN_TOKEN_CLASS.mt2, PADDING_TOKEN_CLASS.p3]"
        >
          <span>{{ t("interviewHub.cards.currentStudio", { studio: selectedStudioName }) }}</span>
        </div>
        <div class="card-actions justify-end" :class="[POINTER_EVENTS_TOKEN_CLASS.auto]">
          <button
            class="btn btn-outline"
            :class="[TOUCH_TARGET_MIN_CLASS]"
            :aria-label="t('interviewHub.cards.configureStudioAria')"
            @click="emit('openStudio')"
          >
            {{ t("interviewHub.cards.configureStudioButton") }}
          </button>
        </div>
      </div>
    </UiGlassCard>
  </SectionGrid>
</template>
