<script setup lang="ts">
import type { InterviewSession, InterviewTargetJob } from "@bao/shared/types/interview";
import { useI18n } from "vue-i18n";
import {
  BADGE_OUTLINE_CLASS,
  BADGE_PRIMARY_OUTLINE_CLASS,
  FLEX_GAP_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  SURFACE_GLASS_CARD_CLASS,
  SURFACE_GLASS_SUBTLE_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import { UI_CHIP_PREVIEW_LIMIT } from "~/constants/numeric-ui";

const props = defineProps<{
  activeSession: InterviewSession;
  targetJob: InterviewTargetJob | undefined;
}>();

const { t } = useI18n();

const focusAreas = computed(() =>
  props.activeSession.config.focusAreas.filter((entry) => entry.trim().length > 0).slice(0, UI_CHIP_PREVIEW_LIMIT),
);

const targetSignals = computed(() => {
  const signals = props.targetJob?.technologies?.filter((entry) => entry.trim().length > 0) ?? [];
  return signals.slice(0, UI_CHIP_PREVIEW_LIMIT);
});

const interviewerPersona = computed(() => props.activeSession.interviewerPersona);
</script>

<template>
  <section :class="SURFACE_GLASS_CARD_CLASS" aria-labelledby="interview-session-context-title">
    <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap4]">
      <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack1]">
        <h2 id="interview-session-context-title" class="card-title" :class="[TYPOGRAPHY_SCALE_CLASS.lg]">
          {{ t("interviewSession.overviewTitle") }}
        </h2>
        <p class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
          {{ t("interviewSession.overviewDescription") }}
        </p>
      </div>

      <details class="collapse collapse-arrow rounded-box border border-base-300" :class="[SURFACE_GLASS_SUBTLE_CLASS]">
        <summary class="collapse-title text-base font-semibold">
          {{ t("interviewSession.targetTitle") }}
        </summary>
        <div class="collapse-content" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4]">
          <p class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
            {{ t("interviewSession.targetDescription") }}
          </p>
          <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack1]">
            <p class="text-base font-semibold text-base-content">
              {{ targetJob?.title ?? activeSession.role }}
            </p>
            <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
              {{ targetJob?.company ?? activeSession.studioName }}
              <span v-if="targetJob?.location"> · {{ targetJob.location }}</span>
            </p>
          </div>

          <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack2]">
            <p class="font-medium text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
              {{ t("interviewSession.focusAreasTitle") }}
            </p>
            <div v-if="focusAreas.length > 0" class="flex flex-wrap" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
              <span 
                v-for="focusArea in focusAreas"
                :key="focusArea"
                :class="BADGE_PRIMARY_OUTLINE_CLASS"
              >
                {{ focusArea }}
              </span>
            </div>
            <p v-else class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
              {{ t("interviewSession.focusAreasEmpty") }}
            </p>
          </div>

          <div v-if="targetSignals.length > 0" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack2]">
            <p class="font-medium text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
              {{ t("interviewSession.promptTagsLabel") }}
            </p>
            <div class="flex flex-wrap" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
              <span 
                v-for="signal in targetSignals"
                :key="signal"
                :class="BADGE_OUTLINE_CLASS"
              >
                {{ signal }}
              </span>
            </div>
          </div>
        </div>
      </details>

      <details class="collapse collapse-arrow rounded-box border border-base-300" :class="[SURFACE_GLASS_SUBTLE_CLASS]">
        <summary class="collapse-title text-base font-semibold">
          {{ t("interviewSession.interviewerTitle") }}
        </summary>
        <div class="collapse-content" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4]">
          <p class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
            {{ t("interviewSession.interviewerDescription") }}
          </p>
          <template v-if="interviewerPersona">
            <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack1]">
              <p class="text-base font-semibold text-base-content">{{ interviewerPersona.name }}</p>
              <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
                {{ interviewerPersona.role }} · {{ interviewerPersona.studioName }}
              </p>
            </div>

            <dl :class="[STACK_SPACE_Y_TOKEN_CLASS.stack3]">
              <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack1]">
                <dt class="font-medium text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
                  {{ t("interviewSession.interviewerRoleLabel") }}
                </dt>
                <dd class="text-base-content" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ interviewerPersona.role }}</dd>
              </div>
              <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack1]">
                <dt class="font-medium text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
                  {{ t("interviewSession.interviewerStyleLabel") }}
                </dt>
                <dd class="text-base-content" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ interviewerPersona.style }}</dd>
              </div>
              <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack1]">
                <dt class="font-medium text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
                  {{ t("interviewSession.interviewerBackgroundLabel") }}
                </dt>
                <dd class="text-base-content" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ interviewerPersona.background }}</dd>
              </div>
            </dl>
          </template>

          <p v-else class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
            {{ t("interviewSession.interviewerFallback") }}
          </p>
        </div>
      </details>
    </div>
  </section>
</template>
