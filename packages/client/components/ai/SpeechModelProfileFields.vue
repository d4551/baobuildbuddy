<script setup lang="ts">
import { SPEECH_PROVIDER_OPTIONS, type SpeechProviderOption } from "@bao/shared/constants/settings";
import { useI18n } from "vue-i18n";
import SectionGrid from "~/components/ui/SectionGrid.vue";
import {
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  MARGIN_TOKEN_CLASS,
  PADDING_TOKEN_CLASS,
  TOUCH_TARGET_MIN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

interface SpeechModelProfileFieldsProps {
  readonly sttProvider: SpeechProviderOption;
  readonly sttModel: string;
  readonly ttsProvider: SpeechProviderOption;
  readonly ttsModel: string;
  readonly providerOptions: readonly SpeechProviderOption[];
  readonly sttModelOptions: readonly string[];
  readonly ttsModelOptions: readonly string[];
  readonly saving: boolean;
}

const props = defineProps<SpeechModelProfileFieldsProps>();
const emit = defineEmits<{
  "update:sttProvider": [value: SpeechProviderOption];
  "update:sttModel": [value: string];
  "update:ttsProvider": [value: SpeechProviderOption];
  "update:ttsModel": [value: string];
  save: [];
}>();
const { t } = useI18n();

const isSpeechProviderOption = (value: string): value is SpeechProviderOption =>
  SPEECH_PROVIDER_OPTIONS.some((option) => option === value);

function handleSttProviderChange(event: Event): void {
  const target = event.target;
  if (!(target instanceof HTMLSelectElement)) {
    return;
  }
  if (!isSpeechProviderOption(target.value)) {
    return;
  }
  emit("update:sttProvider", target.value);
}

function handleTtsProviderChange(event: Event): void {
  const target = event.target;
  if (!(target instanceof HTMLSelectElement)) {
    return;
  }
  if (!isSpeechProviderOption(target.value)) {
    return;
  }
  emit("update:ttsProvider", target.value);
}

function handleSttModelChange(event: Event): void {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) {
    return;
  }
  emit("update:sttModel", target.value);
}

function handleTtsModelChange(event: Event): void {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) {
    return;
  }
  emit("update:ttsModel", target.value);
}
</script>

<template>
  <fieldset class="fieldset rounded-box border border-base-300 bg-base-100" :class="[PADDING_TOKEN_CLASS.p3]">
    <legend class="fieldset-legend" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">{{ t("aiChatPage.voiceSettings.legend") }}</legend>
    <SectionGrid grid-token="twoColumnSmGap2">
      <label class="label" for="speech-profile-stt-provider" :class="[PADDING_TOKEN_CLASS.py0, TYPOGRAPHY_SCALE_CLASS.xs]">
        {{ t("aiChatPage.voiceSettings.sttProviderLabel") }}
      </label>
      <select
        id="speech-profile-stt-provider"
        class="select select-sm" :class="[FLUID_WIDTH_CLASS]"
        :value="props.sttProvider"
        :disabled="props.saving"
        :aria-label="t('aiChatPage.voiceSettings.sttProviderAria')"
        @change="handleSttProviderChange"
      >
        <option
          v-for="provider in props.providerOptions"
          :key="`profile-stt-${provider}`"
          :value="provider"
        >
          {{ t(`aiChatPage.voiceSettings.providers.${provider}`) }}
        </option>
      </select>

      <label class="label" for="speech-profile-tts-provider" :class="[PADDING_TOKEN_CLASS.py0, TYPOGRAPHY_SCALE_CLASS.xs]">
        {{ t("aiChatPage.voiceSettings.ttsProviderLabel") }}
      </label>
      <select
        id="speech-profile-tts-provider"
        class="select select-sm" :class="[FLUID_WIDTH_CLASS]"
        :value="props.ttsProvider"
        :disabled="props.saving"
        :aria-label="t('aiChatPage.voiceSettings.ttsProviderAria')"
        @change="handleTtsProviderChange"
      >
        <option
          v-for="provider in props.providerOptions"
          :key="`profile-tts-${provider}`"
          :value="provider"
        >
          {{ t(`aiChatPage.voiceSettings.providers.${provider}`) }}
        </option>
      </select>

      <label class="label" for="speech-profile-stt-model" :class="[PADDING_TOKEN_CLASS.py0, TYPOGRAPHY_SCALE_CLASS.xs]">
        {{ t("aiChatPage.voiceSettings.sttModelLabel") }}
      </label>
      <input
        id="speech-profile-stt-model"
        class="input input-sm" :class="[FLUID_WIDTH_CLASS]"
        :value="props.sttModel"
        :disabled="props.saving"
        list="speech-profile-stt-model-options"
        :aria-label="t('aiChatPage.voiceSettings.sttModelAria')"
        @input="handleSttModelChange"
      />
      <datalist id="speech-profile-stt-model-options">
        <option
          v-for="model in props.sttModelOptions"
          :key="`profile-stt-model-${model}`"
          :value="model"
        />
      </datalist>

      <label class="label" for="speech-profile-tts-model" :class="[PADDING_TOKEN_CLASS.py0, TYPOGRAPHY_SCALE_CLASS.xs]">
        {{ t("aiChatPage.voiceSettings.ttsModelLabel") }}
      </label>
      <input
        id="speech-profile-tts-model"
        class="input input-sm" :class="[FLUID_WIDTH_CLASS]"
        :value="props.ttsModel"
        :disabled="props.saving"
        list="speech-profile-tts-model-options"
        :aria-label="t('aiChatPage.voiceSettings.ttsModelAria')"
        @input="handleTtsModelChange"
      />
      <datalist id="speech-profile-tts-model-options">
        <option
          v-for="model in props.ttsModelOptions"
          :key="`profile-tts-model-${model}`"
          :value="model"
        />
      </datalist>
    </SectionGrid>
    <div class="flex items-center justify-between" :class="[FLEX_GAP_TOKEN_CLASS.gap2, MARGIN_TOKEN_CLASS.mt2]">
      <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">
        {{ t("aiChatPage.voiceSettings.hint") }}
      </p>
      <button
        type="button"
        class="btn btn-primary"
        :class="[TOUCH_TARGET_MIN_CLASS]"
        :disabled="props.saving"
        :aria-label="t('aiChatPage.voiceSettings.saveAria')"
        @click="emit('save')"
      >
        <LoadingSpinner v-if="props.saving" size="xs" :label="t('common.save')" />
        <span v-else>{{ t("aiChatPage.voiceSettings.saveButton") }}</span>
      </button>
    </div>
  </fieldset>
</template>
