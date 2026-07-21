<script setup lang="ts">
import type { InterviewSession, InterviewTargetJob } from "@bao/shared/types/interview";
import { useI18n } from "vue-i18n";
import PageHeaderBlock from "~/components/ui/PageHeaderBlock.vue";
import {
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  PADDING_TOKEN_CLASS,
  SHADOW_TOKEN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import {
  BADGE_PRIMARY_OUTLINE_CLASS,
} from "~/constants/layout-badges";

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
  <UiGlassCard aria-labelledby="interview-session-briefing-title">
    <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap6]">
      <PageHeaderBlock
        title-id="interview-session-briefing-title"
        :title="sessionTitle"
        :description="sessionSubtitle"
        heading-tag="h2"
      >
        <template #actions>
          <div :class="[BADGE_PRIMARY_OUTLINE_CLASS, PADDING_TOKEN_CLASS.px4, PADDING_TOKEN_CLASS.py3]">
            {{ sessionProgressLabel }}
          </div>
        </template>
      </PageHeaderBlock>

      <div class="stats stats-vertical bg-base-200 lg:stats-horizontal" :class="[FLUID_WIDTH_CLASS, SHADOW_TOKEN_CLASS.sm]">
        <div class="stat" :class="[PADDING_TOKEN_CLASS.px4, PADDING_TOKEN_CLASS.py3]">
          <div class="stat-title">{{ t("interviewSession.timeLabel") }}</div>
          <div class="stat-value" :class="[TYPOGRAPHY_SCALE_CLASS.xl2]">
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

        <div class="stat" :class="[PADDING_TOKEN_CLASS.px4, PADDING_TOKEN_CLASS.py3]">
          <div class="stat-title">{{ t("interviewSession.progressStatTitle") }}</div>
          <div class="stat-value text-primary" :class="[TYPOGRAPHY_SCALE_CLASS.xl2]">{{ roundedProgress }}%</div>
          <div class="stat-desc">
            {{ t("interviewSession.progressStatDescription", { percent: roundedProgress }) }}
          </div>
        </div>

        <div class="stat" :class="[PADDING_TOKEN_CLASS.px4, PADDING_TOKEN_CLASS.py3]">
          <div class="stat-title">{{ t("interviewSession.modeTitle") }}</div>
          <div class="stat-value" :class="[TYPOGRAPHY_SCALE_CLASS.xl2]">{{ modeLabel }}</div>
          <div class="stat-desc">{{ conversationStyleLabel }}</div>
        </div>

        <div class="stat" :class="[PADDING_TOKEN_CLASS.px4, PADDING_TOKEN_CLASS.py3]">
          <div class="stat-title">{{ t("interviewSession.voiceTitle") }}</div>
          <div class="stat-value" :class="[TYPOGRAPHY_SCALE_CLASS.xl2]">{{ voiceValue }}</div>
          <div class="stat-desc">{{ voiceDescription }}</div>
        </div>
      </div>

      <progress 
        class="progress progress-primary" :class="[FLUID_WIDTH_CLASS]"
        :value="progress"
        max="100"
        :aria-label="t('interviewSession.progressAria')"
      ></progress>
    </div>
  </UiGlassCard>
</template>
