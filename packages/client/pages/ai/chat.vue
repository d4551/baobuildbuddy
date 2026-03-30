<script setup lang="ts">
definePageMeta({
  middleware: ["auth"],
});
const {
  CHAT_PAGE_CONTAINER_CLASS,
  locale,
  resolvedBrand,
  loading,
  streaming,
  clearMessages,
  input,
  speechConfig,
  autoSpeakReplies,
  canReplayAssistant,
  voiceSupportHintKey,
  voiceErrorLabel,
  isVoiceListening,
  isVoiceSpeaking,
  supportsRecognition,
  supportsSynthesis,
  selectedVoiceId,
  availableVoices,
  speakLatestAssistantMessage,
  toggleListening,
  speechProviderOptions,
  sttModelOptions,
  ttsModelOptions,
  speechConfigSaving,
  isSpeechConfigDirty,
  renderedMessages,
  latestAssistantMessageIndex,
  streamingBubble,
  hasConversation,
  composerStatusLabel,
  contextChips,
  contextualPrompts,
  currentContextLabel,
  focusedEntityLabel,
  handleChatScroll,
  handlePromptSelection,
  handleComposerKeydown,
  handleSendMessage,
  handleSaveSpeechConfig,
} = useAIChatPage();
</script>

<template>
  <div :class="CHAT_PAGE_CONTAINER_CLASS">
    <div class="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <AIChatConversationPanel
        :resolved-brand="resolvedBrand"
        :locale="locale"
        :loading="loading"
        :streaming="streaming"
        :clear-messages="clearMessages"
        :current-context-label="currentContextLabel"
        :focused-entity-label="focusedEntityLabel"
        :context-chips="contextChips"
        :contextual-prompts="contextualPrompts"
        :has-conversation="hasConversation"
        :rendered-messages="renderedMessages"
        :latest-assistant-message-index="latestAssistantMessageIndex"
        :streaming-bubble="streamingBubble"
        :input="input"
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
        :speech-config="speechConfig"
        :stt-model-options="sttModelOptions"
        :tts-model-options="ttsModelOptions"
        :speech-config-saving="speechConfigSaving"
        :is-speech-config-dirty="isSpeechConfigDirty"
        @scroll="handleChatScroll"
        @clear="clearMessages"
        @prompt="handlePromptSelection"
        @keydown="handleComposerKeydown"
        @send="handleSendMessage"
        @update:input="input = $event"
        @update:selected-voice-id="selectedVoiceId = $event"
        @update:auto-speak-replies="autoSpeakReplies = $event"
        @update:stt-provider="speechConfig.sttProvider = $event"
        @update:stt-model="speechConfig.sttModel = $event"
        @update:tts-provider="speechConfig.ttsProvider = $event"
        @update:tts-model="speechConfig.ttsModel = $event"
        @save-speech="handleSaveSpeechConfig"
        @toggle-listening="toggleListening"
        @replay-assistant="speakLatestAssistantMessage"
      />

      <AIChatSidebar
        :current-context-label="currentContextLabel"
        :focused-entity-label="focusedEntityLabel"
        :context-chips="contextChips"
        :contextual-prompts="contextualPrompts"
        :loading="loading"
        @prompt="handlePromptSelection"
      />
    </div>
  </div>
</template>
