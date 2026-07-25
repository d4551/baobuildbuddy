<script setup lang="ts">
import { AI_CHAT_VOICE_DEFAULT_ID } from "@bao/shared/constants/ai-voice";
import { DEFAULT_SPEECH_SETTINGS, type SpeechProviderOption } from "@bao/shared/constants/settings";
import { useI18n } from "vue-i18n";
import {
  BTN_VARIANT_CLASS,
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  GHOST_ACTION_CLASS,
  ICON_SIZE_CLASS,
  MARGIN_TOKEN_CLASS,
  PADDING_TOKEN_CLASS,
  SVG_STROKE_WIDTH_DEFAULT,
  TOUCH_TARGET_MIN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

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
  readonly ttsProviderOptions?: readonly SpeechProviderOption[];
  readonly sttProvider?: SpeechProviderOption;
  readonly sttModel?: string;
  readonly sttEndpoint?: string;
  readonly sttModelOptions?: readonly string[];
  readonly ttsProvider?: SpeechProviderOption;
  readonly ttsModel?: string;
  readonly ttsEndpoint?: string;
  readonly ttsModelOptions?: readonly string[];
  readonly speechConfigSaving?: boolean;
  readonly compact?: boolean;
  readonly joinItem?: boolean;
}

const props = withDefaults(defineProps<ChatVoiceControlsProps>(), {
  compact: false,
  speechProviderOptions: () => [],
  ttsProviderOptions: () => [],
  sttProvider: DEFAULT_SPEECH_SETTINGS.stt.provider,
  sttModel: DEFAULT_SPEECH_SETTINGS.stt.model,
  sttEndpoint: DEFAULT_SPEECH_SETTINGS.stt.endpoint,
  sttModelOptions: () => [],
  ttsProvider: DEFAULT_SPEECH_SETTINGS.tts.provider,
  ttsModel: DEFAULT_SPEECH_SETTINGS.tts.model,
  ttsEndpoint: DEFAULT_SPEECH_SETTINGS.tts.endpoint,
  ttsModelOptions: () => [],
  speechConfigSaving: false,
  joinItem: false,
});

const emit = defineEmits<{
  "update:selectedVoiceId": [value: string];
  "update:autoSpeakReplies": [value: boolean];
  "update:sttProvider": [value: SpeechProviderOption];
  "update:sttModel": [value: string];
  "update:sttEndpoint": [value: string];
  "update:ttsProvider": [value: SpeechProviderOption];
  "update:ttsModel": [value: string];
  "update:ttsEndpoint": [value: string];
  "save-speech-settings": [];
  "toggle-listening": [];
  "replay-assistant": [];
  "test-on-device-tts": [];
}>();

const { t } = useI18n();

const iconClass = computed(() => (props.compact ? ICON_SIZE_CLASS["4"] : ICON_SIZE_CLASS.sm));
const showAdvancedSpeechConfig = computed(
  () =>
    !props.compact &&
    Array.isArray(props.speechProviderOptions) &&
    props.speechProviderOptions.length > 0 &&
    typeof props.sttProvider === "string" &&
    typeof props.ttsProvider === "string" &&
    typeof props.sttModel === "string" &&
    typeof props.ttsModel === "string" &&
    typeof props.sttEndpoint === "string" &&
    typeof props.ttsEndpoint === "string",
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

const voiceStatusLabel = computed(() => {
  if (props.isListening) {
    return t("aiChatCommon.voice.listeningStatus");
  }
  if (props.isSpeaking) {
    return t("aiChatCommon.voice.speakingStatus");
  }
  return t("aiChatCommon.voice.idleStatus");
});
</script>

<template>
  <button type="button"
    v-if="props.supportsRecognition"
 
 :class="[GHOST_ACTION_CLASS, TOUCH_TARGET_MIN_CLASS, { 'join-item': props.joinItem, [BTN_VARIANT_CLASS.warning]: props.isListening }]"
 data-testid="on-device-stt-mic"
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
      <path stroke-linecap="round" stroke-linejoin="round" :stroke-width="SVG_STROKE_WIDTH_DEFAULT" d="M6 6h12v12H6z" />
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
        :stroke-width="SVG_STROKE_WIDTH_DEFAULT"
        d="M12 1a3 3 0 00-3 3v6a3 3 0 106 0V4a3 3 0 00-3-3z"
      />
      <path stroke-linecap="round" stroke-linejoin="round" :stroke-width="SVG_STROKE_WIDTH_DEFAULT" d="M19 10a7 7 0 11-14 0M12 21v-3" />
    </svg>
  </button>
  <button type="button"
    v-if="props.supportsSynthesis"
 
 :class="[GHOST_ACTION_CLASS, TOUCH_TARGET_MIN_CLASS, { 'join-item': props.joinItem }]"
 data-testid="on-device-tts-test"
 :aria-label="t('aiChatCommon.voice.testOnDeviceAria')"
 :title="t('aiChatCommon.voice.testOnDeviceTitle')"
 @click="emit('test-on-device-tts')"
 >
    <svg
      :class="iconClass"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        :stroke-width="SVG_STROKE_WIDTH_DEFAULT"
        d="M9 18V5l12-2v13"
      />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  </button>
  <button type="button"
    v-if="props.supportsSynthesis"
 
 :class="[GHOST_ACTION_CLASS, TOUCH_TARGET_MIN_CLASS, { 'join-item': props.joinItem }]"
 data-testid="on-device-tts-replay"
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
      <path stroke-linecap="round" stroke-linejoin="round" :stroke-width="SVG_STROKE_WIDTH_DEFAULT" d="M11 5 6 9H3v6h3l5 4V5z" />
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        :stroke-width="SVG_STROKE_WIDTH_DEFAULT"
        d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"
      />
    </svg>
  </button>

  <fieldset v-if="!props.compact && props.supportsSynthesis && props.voices.length > 0" class="fieldset" :class="[MARGIN_TOKEN_CLASS.mt2]">
    <legend class="fieldset-legend" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">{{ t("aiChatCommon.voice.voiceLegend") }}</legend>
    <select
      :value="props.selectedVoiceId"
      class="select select-xs" :class="[FLUID_WIDTH_CLASS]"
      :aria-label="t('aiChatCommon.voice.voiceAria')"
      @change="handleVoiceSelectionChange"
    >
      <option :value="AI_CHAT_VOICE_DEFAULT_ID">{{ t("aiChatCommon.voice.systemVoiceOption") }}</option>
      <option v-for="voice in props.voices" :key="voice.voiceURI" :value="voice.voiceURI">
        {{ voice.name }} ({{ voice.lang }})
      </option>
    </select>
  </fieldset>

  <div v-if="!props.compact && props.supportsSynthesis" class="flex items-center justify-between" :class="[FLEX_GAP_TOKEN_CLASS.gap2, MARGIN_TOKEN_CLASS.mt2]">
    <label class="label cursor-pointer" :class="[PADDING_TOKEN_CLASS.py0, FLEX_GAP_TOKEN_CLASS.gap2]">
      <span :class="[TYPOGRAPHY_SCALE_CLASS.xs]">{{ t("aiChatCommon.voice.autoSpeakLabel") }}</span>
      <input
        :checked="props.autoSpeakReplies"
        type="checkbox"
        class="toggle toggle-xs"
        :aria-label="t('aiChatCommon.voice.autoSpeakAria')"
        @change="handleAutoSpeakChange"
      />
    </label>
    <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.xs]" aria-live="polite">
{{ voiceStatusLabel }}
    </p>
  </div>

  <p
    v-if="!props.compact && props.supportHintKey"
    class="text-secondary" :class="[MARGIN_TOKEN_CLASS.mt2, TYPOGRAPHY_SCALE_CLASS.xs]"
    role="status"
    aria-live="polite"
  >
    {{ t(props.supportHintKey) }}
  </p>

  <p
    v-if="!props.compact && props.errorLabel"
    class="text-error" :class="[MARGIN_TOKEN_CLASS.mt1, TYPOGRAPHY_SCALE_CLASS.xs]"
    role="status"
    aria-live="assertive"
  >
    {{ props.errorLabel }}
  </p>

  <SpeechModelProfileFields
    v-if="showAdvancedSpeechConfig"
    :class="[MARGIN_TOKEN_CLASS.mt3]"
    :provider-options="props.speechProviderOptions ?? []"
    :tts-provider-options="props.ttsProviderOptions ?? []"
    :stt-provider="props.sttProvider"
    :stt-model="props.sttModel"
    :stt-endpoint="props.sttEndpoint"
    :tts-provider="props.ttsProvider"
    :tts-model="props.ttsModel"
    :tts-endpoint="props.ttsEndpoint"
    :stt-model-options="props.sttModelOptions ?? []"
    :tts-model-options="props.ttsModelOptions ?? []"
    :saving="props.speechConfigSaving === true"
    @update:stt-provider="emit('update:sttProvider', $event)"
    @update:stt-model="emit('update:sttModel', $event)"
    @update:stt-endpoint="emit('update:sttEndpoint', $event)"
    @update:tts-provider="emit('update:ttsProvider', $event)"
    @update:tts-model="emit('update:ttsModel', $event)"
    @update:tts-endpoint="emit('update:ttsEndpoint', $event)"
    @save="emit('save-speech-settings')"
  />
</template>
