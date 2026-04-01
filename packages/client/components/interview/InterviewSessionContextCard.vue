<script setup lang="ts">
import type { InterviewSession, InterviewTargetJob } from "@bao/shared/types/interview";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  activeSession: InterviewSession;
  targetJob: InterviewTargetJob | undefined;
}>();

const { t } = useI18n();

const focusAreas = computed(() =>
  props.activeSession.config.focusAreas.filter((entry) => entry.trim().length > 0).slice(0, 6),
);

const targetSignals = computed(() => {
  const signals = props.targetJob?.technologies?.filter((entry) => entry.trim().length > 0) ?? [];
  return signals.slice(0, 6);
});

const interviewerPersona = computed(() => props.activeSession.interviewerPersona);
</script>

<template>
  <section class="card card-border bg-base-100" aria-labelledby="interview-session-context-title">
    <div class="card-body gap-4">
      <div class="space-y-1">
        <h2 id="interview-session-context-title" class="card-title text-lg">
          {{ t("interviewSession.overviewTitle") }}
        </h2>
        <p class="text-sm text-base-content/60">
          {{ t("interviewSession.overviewDescription") }}
        </p>
      </div>

      <details class="collapse collapse-arrow rounded-box border border-base-300 bg-base-200/60">
        <summary class="collapse-title text-base font-semibold">
          {{ t("interviewSession.targetTitle") }}
        </summary>
        <div class="collapse-content space-y-4">
          <div class="space-y-1">
            <p class="text-base font-semibold text-base-content">
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
      </details>

      <details class="collapse collapse-arrow rounded-box border border-base-300 bg-base-200/60">
        <summary class="collapse-title text-base font-semibold">
          {{ t("interviewSession.interviewerTitle") }}
        </summary>
        <div class="collapse-content space-y-4">
          <template v-if="interviewerPersona">
            <div class="space-y-1">
              <p class="text-base font-semibold text-base-content">{{ interviewerPersona.name }}</p>
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
      </details>
    </div>
  </section>
</template>
