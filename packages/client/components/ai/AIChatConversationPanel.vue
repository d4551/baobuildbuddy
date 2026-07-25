<script setup lang="ts">
import type { ChatMessage } from "@bao/shared/types/ai";
import {
  MIN_HEIGHT_ZERO_CLASS,
  SHADOW_TOKEN_CLASS,
} from "~/constants/layout";

defineProps<{
  resolvedBrand: { assistantName: string; name: string };
  locale: string;
  loading: boolean;
  streaming: boolean;
  clearMessages: () => void;
  currentContextLabel: string;
  focusedEntityLabel: string;
  contextChips: string[];
  contextualPrompts: string[];
  hasConversation: boolean;
  renderedMessages: Array<{ key: string; message: ChatMessage }>;
  latestAssistantMessageIndex: number;
  streamingBubble: ChatMessage;
  input: string;
  composerStatusLabel: string;
  autoSpeakReplies: boolean;
  canReplayAssistant: boolean;
  voiceSupportHintKey: string;
  voiceErrorLabel: string;
  isVoiceListening: boolean;
  isVoiceSpeaking: boolean;
  supportsRecognition: boolean;
  supportsSynthesis: boolean;
  selectedVoiceId: string;
  availableVoices: SpeechSynthesisVoice[];
  speechProviderOptions: ReturnType<
    typeof useSpeechModelProfiles
  >["speechProviderOptions"];
  ttsProviderOptions: ReturnType<typeof useSpeechModelProfiles>["ttsProviderOptions"];
  speechConfig: ReturnType<typeof useSpeechModelProfiles>["speechConfig"];
  sttModelOptions: ReturnType<typeof useSpeechModelProfiles>["sttModelOptions"]["value"];
  ttsModelOptions: ReturnType<typeof useSpeechModelProfiles>["ttsModelOptions"]["value"];
  speechConfigSaving: boolean;
  isSpeechConfigDirty: boolean;
}>();

const emit = defineEmits<{
  scroll: [];
  clear: [];
  prompt: [prompt: string];
  keydown: [event: KeyboardEvent];
  send: [];
  "update:input": [value: string];
  "update:selectedVoiceId": [value: string];
  "update:autoSpeakReplies": [value: boolean];
  "update:sttProvider": [value: string];
  "update:sttModel": [value: string];
  "update:sttEndpoint": [value: string];
  "update:ttsProvider": [value: string];
  "update:ttsModel": [value: string];
  "update:ttsEndpoint": [value: string];
  saveSpeech: [];
  toggleListening: [];
  replayAssistant: [];
  testOnDeviceTts: [];
}>();
</script>

<template>
  <section
    class="card border border-base-300 bg-base-100"
    :class="[MIN_HEIGHT_ZERO_CLASS, SHADOW_TOKEN_CLASS.sm]"
  >
    <div class="flex flex-1 flex-col" :class="[MIN_HEIGHT_ZERO_CLASS]">
      <AIChatConversationHeader
        :brand-name="resolvedBrand.name"
        :current-context-label="currentContextLabel"
        :focused-entity-label="focusedEntityLabel"
        :context-chips="contextChips"
        @clear="emit('clear')"
      />

      <AIChatConversationLog
        :assistant-name="resolvedBrand.assistantName"
        :locale="locale"
        :loading="loading"
        :streaming="streaming"
        :contextual-prompts="contextualPrompts"
        :has-conversation="hasConversation"
        :rendered-messages="renderedMessages"
        :latest-assistant-message-index="latestAssistantMessageIndex"
        :streaming-bubble="streamingBubble"
        @scroll="emit('scroll')"
        @prompt="emit('prompt', $event)"
      />

      <AIChatComposerForm
        :assistant-name="resolvedBrand.assistantName"
        :input="input"
        :loading="loading"
        :composer-status-label="composerStatusLabel"
        :auto-speak-replies="autoSpeakReplies"
        :can-replay-assistant="canReplayAssistant"
        :voice-support-hint-key="voiceSupportHintKey"
        :voice-error-label="voiceErrorLabel"
        :is-voice-listening="isVoiceListening"
        :is-voice-speaking="isVoiceSpeaking"
        :supports-recognition="supportsRecognition"
        :supports-synthesis="supportsSynthesis"
        :selected-voice-id="selectedVoiceId"
        :available-voices="availableVoices"
        :speech-provider-options="speechProviderOptions"
        :tts-provider-options="ttsProviderOptions"
        :speech-config="speechConfig"
        :stt-model-options="sttModelOptions"
        :tts-model-options="ttsModelOptions"
        :speech-config-saving="speechConfigSaving"
        :is-speech-config-dirty="isSpeechConfigDirty"
        @keydown="emit('keydown', $event)"
        @send="emit('send')"
        @update:input="emit('update:input', $event)"
        @update:selected-voice-id="emit('update:selectedVoiceId', $event)"
        @update:auto-speak-replies="emit('update:autoSpeakReplies', $event)"
        @update:stt-provider="emit('update:sttProvider', $event)"
        @update:stt-model="emit('update:sttModel', $event)"
        @update:stt-endpoint="emit('update:sttEndpoint', $event)"
        @update:tts-provider="emit('update:ttsProvider', $event)"
        @update:tts-model="emit('update:ttsModel', $event)"
        @update:tts-endpoint="emit('update:ttsEndpoint', $event)"
        @save-speech="emit('saveSpeech')"
        @toggle-listening="emit('toggleListening')"
        @replay-assistant="emit('replayAssistant')"
        @test-on-device-tts="emit('testOnDeviceTts')"
      />
    </div>
  </section>
</template>
