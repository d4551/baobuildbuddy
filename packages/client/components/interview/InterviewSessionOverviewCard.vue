<script setup lang="ts">
import { SHADOW_TOKEN_CLASS } from "~/constants/layout";
import type { InterviewSession, InterviewTargetJob } from "@bao/shared/types/interview";
import { useI18n } from "vue-i18n";
import PageHeaderBlock from "~/components/ui/PageHeaderBlock.vue";

const props = defineProps<{
  activeSession: InterviewSession;
  canUseVoice: boolean;
  elapsedTimeAriaLabel: string;
  elapsedTimeDuration: string;
  elapsedTimeText: string;
  progress: number;
  sessionProgressLabel: string;
  targetJob: InterviewTargetJob | undefined;
}>();

const { t } = useI18n();

const sessionTitle = computed(() => {
  const role = props.targetJob?.title ?? props.activeSession.role ?? t("interviewHub.mode.job");
  const studio = props.targetJob?.company ?? props.activeSession.studioName ?? "";

  return studio.length > 0 ? `${role} · ${studio}` : role;
});

const sessionSubtitle = computed(() => t("interviewSession.subtitle"));

const modeLabel = computed(() =>
  props.targetJob ? t("interviewHub.mode.job") : t("interviewHub.mode.studio"),
);

const conversationStyleLabel = computed(() => {
  const style = props.activeSession.config.conversationStyle;
  if (style === "structured") {
    return t("interviewHub.config.conversationStyleStructured");
  }

  return t("interviewHub.config.conversationStyleNatural");
});

const voiceValue = computed(() =>
  props.canUseVoice ? t("interviewSession.voiceEnabled") : t("interviewSession.voiceDisabled"),
);

const voiceDescription = computed(() =>
  props.canUseVoice
    ? t("interviewSession.voiceDescriptionEnabled")
    : t("interviewSession.voiceDescriptionDisabled"),
);

const roundedProgress = computed(() => Math.round(props.progress));
</script>

<template>
  <section class="card card-border bg-base-100" aria-labelledby="interview-session-briefing-title">
    <div class="card-body gap-6">
      <PageHeaderBlock
        title-id="interview-session-briefing-title"
        :title="sessionTitle"
        :description="sessionSubtitle"
        heading-tag="h2"
      >
        <template #actions>
          <div class="badge badge-outline badge-primary px-4 py-3">
            {{ sessionProgressLabel }}
          </div>
        </template>
      </PageHeaderBlock>

      <div class="stats stats-vertical w-full bg-base-200 lg:stats-horizontal" :class="[SHADOW_TOKEN_CLASS.sm]">
        <div class="stat px-4 py-3">
          <div class="stat-title">{{ t("interviewSession.timeLabel") }}</div>
          <div class="stat-value text-2xl">
            <time
              class="font-mono tabular-nums"
              :datetime="elapsedTimeDuration"
              :aria-label="elapsedTimeAriaLabel"
              aria-live="polite"
            >
              {{ elapsedTimeText }}
            </time>
          </div>
          <div class="stat-desc">{{ t("interviewSession.overviewDescription") }}</div>
        </div>

        <div class="stat px-4 py-3">
          <div class="stat-title">{{ t("interviewSession.progressStatTitle") }}</div>
          <div class="stat-value text-2xl text-primary">{{ roundedProgress }}%</div>
          <div class="stat-desc">
            {{ t("interviewSession.progressStatDescription", { percent: roundedProgress }) }}
          </div>
        </div>

        <div class="stat px-4 py-3">
          <div class="stat-title">{{ t("interviewSession.modeTitle") }}</div>
          <div class="stat-value text-2xl">{{ modeLabel }}</div>
          <div class="stat-desc">{{ conversationStyleLabel }}</div>
        </div>

        <div class="stat px-4 py-3">
          <div class="stat-title">{{ t("interviewSession.voiceTitle") }}</div>
          <div class="stat-value text-2xl">{{ voiceValue }}</div>
          <div class="stat-desc">{{ voiceDescription }}</div>
        </div>
      </div>

      <progress
        class="progress progress-primary w-full"
        :value="progress"
        max="100"
        :aria-label="t('interviewSession.progressAria')"
      ></progress>
    </div>
  </section>
</template>
