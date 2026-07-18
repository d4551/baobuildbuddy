<script setup lang="ts">
import type { InterviewConversationStyle, InterviewMode } from "@bao/shared/types/interview";
import { useI18n } from "vue-i18n";
import {
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  MARGIN_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import type { InterviewHubSessionConfig } from "~/types/interview";

defineProps<{
  selectedMode: InterviewMode;
  roleSuggestionsListId: string;
  sessionConfig: InterviewHubSessionConfig;
  interviewRoleOptions: readonly string[];
  interviewExperienceOptions: readonly string[];
  interviewQuestionCountOptions: readonly number[];
  ttsVoices: readonly SpeechSynthesisVoice[];
  experienceLabel: (level: string) => string;
  questionCountLabel: (count: number) => string;
}>();

const emit = defineEmits<{
  "update:role": [value: string];
  "update:experience-level": [value: string];
  "update:question-count": [value: number];
  "update:conversation-style": [value: InterviewConversationStyle];
  "update:enable-voice-mode": [value: boolean];
  "update:voice-id": [value: string];
}>();

const { t } = useI18n();

function updateTextValue(
  event: Event,
  emitEvent: "update:role" | "update:experience-level" | "update:voice-id",
): void {
  const target = event.target;
  if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement) {
    emit(emitEvent, target.value);
  }
}

function updateQuestionCount(event: Event): void {
  const target = event.target;
  if (!(target instanceof HTMLSelectElement)) {
    return;
  }

  const parsed = Number.parseInt(target.value, 10);
  if (Number.isFinite(parsed)) {
    emit("update:question-count", parsed);
  }
}

function updateConversationStyle(event: Event): void {
  const target = event.target;
  if (!(target instanceof HTMLSelectElement)) {
    return;
  }

  if (target.value === "natural" || target.value === "structured") {
    emit("update:conversation-style", target.value);
  }
}

function updateEnableVoiceMode(event: Event): void {
  const target = event.target;
  if (target instanceof HTMLInputElement) {
    emit("update:enable-voice-mode", target.checked);
  }
}
</script>

<template>
  <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4]">
    <fieldset class="fieldset">
      <legend class="fieldset-legend">{{ t("interviewHub.config.roleLegend") }}</legend>
      <input
        v-if="selectedMode === 'job'"
        :value="sessionConfig.role"
        :list="roleSuggestionsListId"
        class="input" :class="[FLUID_WIDTH_CLASS]"
        :aria-label="t('interviewHub.config.roleAria')"
        @input="updateTextValue($event, 'update:role')"
      />
      <select
        v-else
        :value="sessionConfig.role"
        class="select" :class="[FLUID_WIDTH_CLASS]"
        :aria-label="t('interviewHub.config.roleAria')"
        @change="updateTextValue($event, 'update:role')"
      >
        <option v-for="role in interviewRoleOptions" :key="role" :value="role">
          {{ role }}
        </option>
      </select>
      <datalist :id="roleSuggestionsListId">
        <option
          v-for="role in interviewRoleOptions"
          :key="`${role}-suggestion`"
          :value="role"
        />
      </datalist>
    </fieldset>

    <fieldset class="fieldset">
      <legend class="fieldset-legend">{{ t("interviewHub.config.experienceLegend") }}</legend>
      <select
        :value="sessionConfig.experienceLevel"
        class="select" :class="[FLUID_WIDTH_CLASS]"
        :aria-label="t('interviewHub.config.experienceAria')"
        @change="updateTextValue($event, 'update:experience-level')"
      >
        <option v-for="level in interviewExperienceOptions" :key="level" :value="level">
          {{ experienceLabel(level) }}
        </option>
      </select>
    </fieldset>

    <fieldset class="fieldset">
      <legend class="fieldset-legend">{{ t("interviewHub.config.questionCountLegend") }}</legend>
      <select
        :value="sessionConfig.questionCount"
        class="select" :class="[FLUID_WIDTH_CLASS]"
        :aria-label="t('interviewHub.config.questionCountAria')"
        @change="updateQuestionCount"
      >
        <option
          v-for="option in interviewQuestionCountOptions"
          :key="option"
          :value="option"
        >
          {{ questionCountLabel(option) }}
        </option>
      </select>
    </fieldset>

    <fieldset class="fieldset">
      <legend class="fieldset-legend">{{ t("interviewHub.config.conversationStyleLegend") }}</legend>
      <select
        :value="sessionConfig.conversationStyle"
        class="select" :class="[FLUID_WIDTH_CLASS]"
        :aria-label="t('interviewHub.config.conversationStyleAria')"
        @change="updateConversationStyle"
      >
        <option value="natural">
          {{ t("interviewHub.config.conversationStyleNatural") }}
        </option>
        <option value="structured">
          {{ t("interviewHub.config.conversationStyleStructured") }}
        </option>
      </select>
      <p class="text-muted" :class="[MARGIN_TOKEN_CLASS.mt2, TYPOGRAPHY_SCALE_CLASS.xs]">
        {{ t("interviewHub.config.conversationStyleHint") }}
      </p>
    </fieldset>

    <label class="label cursor-pointer justify-start" :class="[FLEX_GAP_TOKEN_CLASS.gap3]">
      <input
        :checked="sessionConfig.enableVoiceMode"
        type="checkbox"
        class="toggle toggle-primary"
        :aria-label="t('interviewHub.config.enableVoiceAria')"
        @change="updateEnableVoiceMode"
      />
      <span class="label">{{ t("interviewHub.config.enableVoiceLabel") }}</span>
    </label>

    <fieldset v-if="sessionConfig.enableVoiceMode" class="fieldset">
      <legend class="fieldset-legend">{{ t("interviewHub.config.ttsVoiceLegend") }}</legend>
      <select
        :value="sessionConfig.voiceSettings.voiceId ?? ''"
        class="select" :class="[FLUID_WIDTH_CLASS]"
        :aria-label="t('interviewHub.config.ttsVoiceAria')"
        @change="updateTextValue($event, 'update:voice-id')"
      >
        <option value="">{{ t("interviewHub.config.ttsDefaultOption") }}</option>
        <option
          v-for="voice in ttsVoices"
          :key="voice.voiceURI"
          :value="voice.voiceURI"
        >
          {{ voice.name }} ({{ voice.lang }})
        </option>
      </select>
    </fieldset>
  </div>
</template>
