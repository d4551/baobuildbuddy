<script setup lang="ts">
import type { InterviewSession, InterviewTargetJob } from "@bao/shared/types/interview";
import { useI18n } from "vue-i18n";
import PageHeaderBlock from "~/components/ui/PageHeaderBlock.vue";
import SectionGrid from "~/components/ui/SectionGrid.vue";

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

const targetSignals = computed(() => {
  const signals = props.targetJob?.technologies?.filter((entry) => entry.trim().length > 0) ?? [];
  return signals.slice(0, 6);
});

const focusAreas = computed(() =>
  props.activeSession.config.focusAreas.filter((entry) => entry.trim().length > 0).slice(0, 6),
);

const interviewerPersona = computed(() => props.activeSession.interviewerPersona);
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

      <div class="stats stats-vertical w-full bg-base-200 shadow-sm lg:stats-horizontal">
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

      <SectionGrid grid-token="split">
        <div class="space-y-4">
          <section class="card card-border bg-base-200/50" aria-labelledby="interview-session-target-title">
            <div class="card-body gap-4">
              <div class="space-y-1">
                <h3 id="interview-session-target-title" class="card-title text-base">
                  {{ t("interviewSession.targetTitle") }}
                </h3>
                <p class="text-sm text-base-content/60">
                  {{ t("interviewSession.targetDescription") }}
                </p>
              </div>

              <div class="space-y-2">
                <p class="text-lg font-semibold">
                  {{ targetJob?.title ?? activeSession.role }}
                </p>
                <p class="text-sm text-base-content/70">
                  {{ targetJob?.company ?? activeSession.studioName }}
                  <span v-if="targetJob?.location"> · {{ targetJob.location }}</span>
                </p>
              </div>

              <div class="space-y-2">
                <p class="text-sm font-medium text-base-content/70">
                  {{ t("interviewSession.focusAreasTitle") }}
                </p>
                <div v-if="focusAreas.length > 0" class="flex flex-wrap gap-2">
                  <span
                    v-for="focusArea in focusAreas"
                    :key="focusArea"
                    class="badge badge-outline badge-primary"
                  >
                    {{ focusArea }}
                  </span>
                </div>
                <p v-else class="text-sm text-base-content/60">
                  {{ t("interviewSession.focusAreasEmpty") }}
                </p>
              </div>

              <div v-if="targetSignals.length > 0" class="space-y-2">
                <p class="text-sm font-medium text-base-content/70">
                  {{ t("interviewSession.promptTagsLabel") }}
                </p>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="signal in targetSignals"
                    :key="signal"
                    class="badge badge-outline"
                  >
                    {{ signal }}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>

        <section class="card card-border bg-base-200/50" aria-labelledby="interview-session-interviewer-title">
          <div class="card-body gap-4">
            <div class="space-y-1">
              <h3 id="interview-session-interviewer-title" class="card-title text-base">
                {{ t("interviewSession.interviewerTitle") }}
              </h3>
              <p class="text-sm text-base-content/60">
                {{ t("interviewSession.interviewerDescription") }}
              </p>
            </div>

            <template v-if="interviewerPersona">
              <div class="space-y-1">
                <p class="text-lg font-semibold">{{ interviewerPersona.name }}</p>
                <p class="text-sm text-base-content/70">
                  {{ interviewerPersona.role }} · {{ interviewerPersona.studioName }}
                </p>
              </div>

              <dl class="space-y-3">
                <div class="space-y-1">
                  <dt class="text-sm font-medium text-base-content/70">
                    {{ t("interviewSession.interviewerRoleLabel") }}
                  </dt>
                  <dd class="text-sm text-base-content">{{ interviewerPersona.role }}</dd>
                </div>
                <div class="space-y-1">
                  <dt class="text-sm font-medium text-base-content/70">
                    {{ t("interviewSession.interviewerStyleLabel") }}
                  </dt>
                  <dd class="text-sm text-base-content">{{ interviewerPersona.style }}</dd>
                </div>
                <div class="space-y-1">
                  <dt class="text-sm font-medium text-base-content/70">
                    {{ t("interviewSession.interviewerBackgroundLabel") }}
                  </dt>
                  <dd class="text-sm text-base-content">{{ interviewerPersona.background }}</dd>
                </div>
              </dl>
            </template>

            <p v-else class="text-sm text-base-content/60">
              {{ t("interviewSession.interviewerFallback") }}
            </p>
          </div>
        </section>
      </SectionGrid>
    </div>
  </section>
</template>
