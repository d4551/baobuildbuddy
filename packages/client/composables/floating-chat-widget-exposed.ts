import { AI_CHAT_PAGE_PATH } from "@bao/shared/constants/ai-chat";
import { FLOATING_CHAT_PANEL_ID } from "~/constants/layout";
import type { FloatingChatWidgetState } from "./floating-chat-widget-contracts";

export const createFloatingChatWidgetUiExposedState = (state: FloatingChatWidgetState) => {
  return {
    AI_CHAT_PAGE_PATH,
    chatPanelId: FLOATING_CHAT_PANEL_ID,
    resolvedBrand: state.resolvedBrand,
    t: state.t,
    locale: state.locale,
    messages: state.ai.messages,
    loading: state.ai.loading,
    streaming: state.ai.streaming,
    clearMessages: state.ai.clearMessages,
    isOpen: state.uiState.isOpen,
    isSpeechSettingsOpen: state.uiState.isSpeechSettingsOpen,
    draft: state.uiState.draft,
    unreadCount: state.uiState.unreadCount,
    panelBodyRef: state.uiState.panelBodyRef,
    inputRef: state.uiState.inputRef,
    contextChips: state.derivedState.contextChips,
    contextualPrompts: state.derivedState.contextualPrompts,
    currentContextLabel: state.derivedState.currentContextLabel,
    focusedEntityLabel: state.derivedState.focusedEntityLabel,
    renderedMessages: state.derivedState.renderedMessages,
    latestAssistantMessageIndex: state.derivedState.latestAssistantMessageIndex,
    streamingBubble: state.derivedState.streamingBubble,
    hasConversation: state.derivedState.hasConversation,
    showWidget: state.derivedState.showWidget,
    handlePanelScroll: state.handlePanelScroll,
    toggleWidget: state.panelActions.toggleWidget,
    closeWidget: state.panelActions.closeWidget,
    toggleSpeechSettings: state.panelActions.toggleSpeechSettings,
    handleSendMessage: state.messageActions.handleSendMessage,
    handlePromptInput: state.messageActions.handlePromptInput,
    handleDraftKeydown: state.messageActions.handleDraftKeydown,
  };
};

export const createFloatingChatWidgetSpeechExposedState = (state: FloatingChatWidgetState) => {
  return {
    autoSpeakReplies: state.voice.autoSpeakReplies,
    canReplayAssistant: state.voice.canReplayAssistant,
    voiceSupportHintKey: state.voice.supportHintKey,
    voiceErrorLabel: state.derivedState.voiceErrorLabel,
    isVoiceListening: state.voice.isListening,
    isVoiceSpeaking: state.voice.isSpeaking,
    supportsRecognition: state.voice.supportsRecognition,
    supportsSynthesis: state.voice.supportsSynthesis,
    selectedVoiceId: state.voice.selectedVoiceId,
    availableVoices: state.voice.voices,
    speakLatestAssistantMessage: state.voice.speakLatestAssistantMessage,
    toggleListening: state.voice.toggleListening,
    speechProviderOptions: state.speechProfiles.speechProviderOptions,
    speechConfig: state.speechProfiles.speechConfig,
    sttModelOptions: state.speechProfiles.sttModelOptions,
    ttsModelOptions: state.speechProfiles.ttsModelOptions,
    speechConfigSaving: state.speechProfiles.speechConfigSaving,
    isSpeechConfigDirty: state.speechProfiles.isSpeechConfigDirty,
    handleSaveSpeechConfig: state.speechActions.handleSaveSpeechConfig,
  };
};

export const createFloatingChatWidgetExposedState = (state: FloatingChatWidgetState) => {
  return {
    ...createFloatingChatWidgetUiExposedState(state),
    ...createFloatingChatWidgetSpeechExposedState(state),
  };
};
