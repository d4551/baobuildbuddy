<script setup lang="ts">
import {
  AI_CHAT_VOICE_DEFAULT_ID,
  DEFAULT_SPEECH_SETTINGS,
  type SpeechProviderOption,
} from "@bao/shared";
import { useI18n } from "vue-i18n";

interface ChatVoiceControlsProps {
  readonly loading: boolean;
  readonly supportsRecognition: boolean;
  readonly supportsSynthesis: boolean;
  readonly canReplayAssistant: boolean;
  readonly isListening: boolean;
  readonly isSpeaking: boolean;
  readonly voices: readonly SpeechSynthesisVoice[];
  readonly selectedVoiceId: string;
  readonly autoSpeakReplies: boolean;
  readonly supportHintKey: string;
  readonly errorLabel: string;
  readonly speechProviderOptions?: readonly SpeechProviderOption[];
  readonly sttProvider?: SpeechProviderOption;
  readonly sttModel?: string;
  readonly sttModelOptions?: readonly string[];
  readonly ttsProvider?: SpeechProviderOption;
  readonly ttsModel?: string;
  readonly ttsModelOptions?: readonly string[];
  readonly speechConfigSaving?: boolean;
  readonly compact?: boolean;
}

const props = withDefaults(defineProps<ChatVoiceControlsProps>(), {
  compact: false,
  speechProviderOptions: () => [],
  sttProvider: DEFAULT_SPEECH_SETTINGS.stt.provider,
  sttModel: DEFAULT_SPEECH_SETTINGS.stt.model,
  sttModelOptions: () => [],
  ttsProvider: DEFAULT_SPEECH_SETTINGS.tts.provider,
  ttsModel: DEFAULT_SPEECH_SETTINGS.tts.model,
  ttsModelOptions: () => [],
  speechConfigSaving: false,
});

const emit = defineEmits<{
  "update:selectedVoiceId": [value: string];
  "update:autoSpeakReplies": [value: boolean];
  "update:sttProvider": [value: SpeechProviderOption];
  "update:sttModel": [value: string];
  "update:ttsProvider": [value: SpeechProviderOption];
  "update:ttsModel": [value: string];
  "save-speech-settings": [];
  "toggle-listening": [];
  "replay-assistant": [];
}>();

const { t } = useI18n();

const iconClass = computed(() => (props.compact ? "h-4 w-4" : "h-5 w-5"));
const showAdvancedSpeechConfig = computed(
  () =>
    !props.compact &&
    Array.isArray(props.speechProviderOptions) &&
    props.speechProviderOptions.length > 0 &&
    typeof props.sttProvider === "string" &&
    typeof props.ttsProvider === "string" &&
    typeof props.sttModel === "string" &&
    typeof props.ttsModel === "string",
);

function handleVoiceSelectionChange(event: Event): void {
  const target = event.target;
  if (!(target instanceof HTMLSelectElement)) {
    return;
  }

  emit("update:selectedVoiceId", target.value);
}

function handleAutoSpeakChange(event: Event): void {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) {
    return;
  }

  emit("update:autoSpeakReplies", target.checked);
}
</script>

<template>
  <button
    v-if="props.supportsRecognition"
    class="btn btn-ghost join-item"
    :class="props.isListening ? 'btn-warning' : ''"
    :title="
      props.isListening
        ? t('aiChatCommon.voice.stopTitle')
        : t('aiChatCommon.voice.startTitle')
    "
    :aria-label="
      props.isListening
        ? t('aiChatCommon.voice.stopAria')
        : t('aiChatCommon.voice.startAria')
    "
    @click="emit('toggle-listening')"
  >
    <svg
      v-if="props.isListening"
      :class="iconClass"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 6h12v12H6z" />
    </svg>
    <svg
      v-else
      :class="iconClass"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M12 1a3 3 0 00-3 3v6a3 3 0 106 0V4a3 3 0 00-3-3z"
      />
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 10a7 7 0 11-14 0M12 21v-3" />
    </svg>
  </button>
  <button
    v-if="props.supportsSynthesis"
    class="btn btn-ghost join-item"
    :aria-label="t('aiChatCommon.voice.replayAria')"
    :title="t('aiChatCommon.voice.replayTitle')"
    :disabled="!props.canReplayAssistant || props.loading"
    @click="emit('replay-assistant')"
  >
    <svg
      :class="iconClass"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5 6 9H3v6h3l5 4V5z" />
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"
      />
    </svg>
  </button>

  <fieldset v-if="!props.compact && props.supportsSynthesis && props.voices.length > 0" class="fieldset mt-2">
    <legend class="fieldset-legend text-xs">{{ t("aiChatCommon.voice.voiceLegend") }}</legend>
    <select
      :value="props.selectedVoiceId"
      class="select select-bordered select-xs w-full"
      :aria-label="t('aiChatCommon.voice.voiceAria')"
      @change="handleVoiceSelectionChange"
    >
      <option :value="AI_CHAT_VOICE_DEFAULT_ID">{{ t("aiChatCommon.voice.systemVoiceOption") }}</option>
      <option v-for="voice in props.voices" :key="voice.voiceURI" :value="voice.voiceURI">
        {{ voice.name }} ({{ voice.lang }})
      </option>
    </select>
  </fieldset>

  <div v-if="!props.compact && props.supportsSynthesis" class="mt-2 flex items-center justify-between gap-2">
    <label class="label cursor-pointer gap-2 py-0">
      <span class="label-text text-xs">{{ t("aiChatCommon.voice.autoSpeakLabel") }}</span>
      <input
        :checked="props.autoSpeakReplies"
        type="checkbox"
        class="toggle toggle-xs"
        :aria-label="t('aiChatCommon.voice.autoSpeakAria')"
        @change="handleAutoSpeakChange"
      />
    </label>
    <p class="text-xs text-base-content/70" aria-live="polite">
      {{
        props.isListening
          ? t("aiChatCommon.voice.listeningStatus")
          : props.isSpeaking
            ? t("aiChatCommon.voice.speakingStatus")
            : t("aiChatCommon.voice.idleStatus")
      }}
    </p>
  </div>

  <p
    v-if="!props.compact && props.supportHintKey"
    class="mt-2 text-xs text-base-content/70"
    role="status"
    aria-live="polite"
  >
    {{ t(props.supportHintKey) }}
  </p>

  <p
    v-if="!props.compact && props.errorLabel"
    class="mt-1 text-xs text-error"
    role="status"
    aria-live="assertive"
  >
    {{ props.errorLabel }}
  </p>

  <SpeechModelProfileFields
    v-if="showAdvancedSpeechConfig"
    class="mt-3"
    :provider-options="props.speechProviderOptions ?? []"
    :stt-provider="props.sttProvider"
    :stt-model="props.sttModel"
    :tts-provider="props.ttsProvider"
    :tts-model="props.ttsModel"
    :stt-model-options="props.sttModelOptions ?? []"
    :tts-model-options="props.ttsModelOptions ?? []"
    :saving="props.speechConfigSaving === true"
    @update:stt-provider="emit('update:sttProvider', $event)"
    @update:stt-model="emit('update:sttModel', $event)"
    @update:tts-provider="emit('update:ttsProvider', $event)"
    @update:tts-model="emit('update:ttsModel', $event)"
    @save="emit('save-speech-settings')"
  />
</template>
