<script setup lang="ts">
import { useFloatingChatWidget } from "~/composables/useFloatingChatWidget";
import { FLEX_GAP_TOKEN_CLASS } from "~/constants/layout";

const {
  AI_CHAT_PAGE_PATH: aiChatPagePath,
  availableVoices,
  autoSpeakReplies,
  canReplayAssistant,
  chatPanelId,
  clearMessages,
  closeWidget,
  contextChips,
  contextualPrompts,
  currentContextLabel,
  draft,
  focusedEntityLabel,
  handleDraftKeydown,
  handlePanelScroll,
  handlePromptInput,
  handleSaveSpeechConfig,
  handleSendMessage,
  hasConversation,
  isOpen,
  isSpeechConfigDirty,
  isSpeechSettingsOpen,
  isVoiceListening,
  isVoiceSpeaking,
  latestAssistantMessageIndex,
  loading,
  locale,
  renderedMessages,
  resolvedBrand,
  selectedVoiceId,
  showWidget,
  speakLatestAssistantMessage,
  speechConfig,
  speechConfigSaving,
  speechProviderOptions,
  sttModelOptions,
  streaming,
  streamingBubble,
  supportsRecognition,
  supportsSynthesis,
  t,
  toggleListening,
  toggleSpeechSettings,
  toggleWidget,
  ttsModelOptions,
  unreadCount,
  voiceErrorLabel,
  voiceSupportHintKey,
} = useFloatingChatWidget();
</script>

<template>
  <Teleport to="body">
    <div 
      v-if="showWidget"
      class="fixed bottom-24 right-4 z-40 flex flex-col items-end lg:bottom-6 lg:right-6" :class="[FLEX_GAP_TOKEN_CLASS.gap3]"
    >
      <FloatingChatPanel
        :ai-chat-page-path="aiChatPagePath"
        :auto-speak-replies="autoSpeakReplies"
        :available-voices="availableVoices"
        :can-replay-assistant="canReplayAssistant"
        :chat-panel-id="chatPanelId"
        :context-chips="contextChips"
        :contextual-prompts="contextualPrompts"
        :current-context-label="currentContextLabel"
        v-model:draft="draft"
        :focused-entity-label="focusedEntityLabel"
        :has-conversation="hasConversation"
        :is-open="isOpen"
        :is-speech-config-dirty="isSpeechConfigDirty"
        :is-speech-settings-open="isSpeechSettingsOpen"
        :is-voice-listening="isVoiceListening"
        :is-voice-speaking="isVoiceSpeaking"
        :latest-assistant-message-index="latestAssistantMessageIndex"
        :loading="loading"
        :locale="locale"
        :rendered-messages="renderedMessages"
        :resolved-brand="resolvedBrand"
        :selected-voice-id="selectedVoiceId"
        :show-widget="showWidget"
        :speech-config="speechConfig"
        :speech-config-saving="speechConfigSaving"
        :speech-provider-options="speechProviderOptions"
        :stt-model-options="sttModelOptions"
        :streaming="streaming"
        :streaming-bubble="streamingBubble"
        :supports-recognition="supportsRecognition"
        :supports-synthesis="supportsSynthesis"
        :tts-model-options="ttsModelOptions"
        :voice-error-label="voiceErrorLabel"
        :voice-support-hint-key="voiceSupportHintKey"
        @clear="clearMessages"
        @close="closeWidget"
        @prompt="handlePromptInput"
        @scroll="handlePanelScroll"
        @send="handleSendMessage"
        @toggle-listening="toggleListening"
        @toggle-speech-settings="toggleSpeechSettings"
        @replay-assistant="speakLatestAssistantMessage"
        @save-speech-config="handleSaveSpeechConfig"
        @update:selected-voice-id="selectedVoiceId = $event"
        @update:auto-speak-replies="autoSpeakReplies = $event"
        @update:stt-provider="speechConfig.sttProvider = $event"
        @update:stt-model="speechConfig.sttModel = $event"
        @update:tts-provider="speechConfig.ttsProvider = $event"
        @update:tts-model="speechConfig.ttsModel = $event"
        @draft-keydown="handleDraftKeydown"
      />

      <FloatingChatToggleButton
        :chat-panel-id="chatPanelId"
        :is-open="isOpen"
        :unread-count="unreadCount"
        :t="t"
        @toggle="toggleWidget"
      />
    </div>
  </Teleport>
</template>
