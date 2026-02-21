<script setup lang="ts">
import { SPEECH_PROVIDER_OPTIONS, type SpeechProviderOption } from "@bao/shared";
import { useI18n } from "vue-i18n";

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
  <fieldset class="fieldset rounded-box border border-base-300 bg-base-100 p-3">
    <legend class="fieldset-legend text-xs">{{ t("aiChatPage.voiceSettings.legend") }}</legend>
    <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <label class="label py-0 text-xs" for="speech-profile-stt-provider">
        {{ t("aiChatPage.voiceSettings.sttProviderLabel") }}
      </label>
      <select
        id="speech-profile-stt-provider"
        class="select select-bordered select-sm w-full"
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

      <label class="label py-0 text-xs" for="speech-profile-tts-provider">
        {{ t("aiChatPage.voiceSettings.ttsProviderLabel") }}
      </label>
      <select
        id="speech-profile-tts-provider"
        class="select select-bordered select-sm w-full"
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

      <label class="label py-0 text-xs" for="speech-profile-stt-model">
        {{ t("aiChatPage.voiceSettings.sttModelLabel") }}
      </label>
      <input
        id="speech-profile-stt-model"
        class="input input-bordered input-sm w-full"
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

      <label class="label py-0 text-xs" for="speech-profile-tts-model">
        {{ t("aiChatPage.voiceSettings.ttsModelLabel") }}
      </label>
      <input
        id="speech-profile-tts-model"
        class="input input-bordered input-sm w-full"
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
    </div>
    <div class="mt-2 flex items-center justify-between gap-2">
      <p class="text-xs text-base-content/70">
        {{ t("aiChatPage.voiceSettings.hint") }}
      </p>
      <button
        type="button"
        class="btn btn-primary btn-xs"
        :disabled="props.saving"
        :aria-label="t('aiChatPage.voiceSettings.saveAria')"
        @click="emit('save')"
      >
        <span v-if="props.saving" class="loading loading-spinner loading-xs" />
        <span v-else>{{ t("aiChatPage.voiceSettings.saveButton") }}</span>
      </button>
    </div>
  </fieldset>
</template>
