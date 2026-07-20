import {
  createFloatingChatWidgetMessageActions,
  createFloatingChatWidgetPanelActions,
  createFloatingChatWidgetSpeechActions,
} from "./floating-chat-widget-actions";
import { createFloatingChatWidgetCoreState } from "./floating-chat-widget-core";
import {
  createFloatingChatWidgetDerivedState,
  createWidgetScrollHandlers,
  useFloatingChatWidgetLifecycle,
  useFloatingChatWidgetWatchers,
} from "./floating-chat-widget-derived";
import { createFloatingChatWidgetExposedState } from "./floating-chat-widget-exposed";

const createFloatingChatWidgetBehaviorState = (
  coreState: ReturnType<typeof createFloatingChatWidgetCoreState>,
) => {
  const derivedState = createFloatingChatWidgetDerivedState({
    messages: coreState.ai.messages,
    streaming: coreState.ai.streaming,
    streamingContent: coreState.ai.streamingContent,
    route: coreState.route,
    buildCurrentContext: coreState.ai.buildCurrentContext,
    t: coreState.t,
    voiceErrorMessageKey: coreState.voice.errorMessageKey,
  });
  const { scrollToBottom, handlePanelScroll } = createWidgetScrollHandlers(
    coreState.uiState.panelBodyRef,
    coreState.uiState.shouldStickToBottom,
  );
  const panelActions = createFloatingChatWidgetPanelActions({
    isOpen: coreState.uiState.isOpen,
    isSpeechSettingsOpen: coreState.uiState.isSpeechSettingsOpen,
    unreadCount: coreState.uiState.unreadCount,
    inputRef: coreState.uiState.inputRef,
    ensureSpeechConfigLoaded: coreState.speechProfiles.ensureSpeechConfigLoaded,
    toast: coreState.toast,
    t: coreState.t,
  });
  const messageActions = createFloatingChatWidgetMessageActions({
    draft: coreState.uiState.draft,
    loading: coreState.ai.loading,
    isVoiceListening: coreState.voice.isListening,
    stopListening: coreState.voice.stopListening,
    shouldStickToBottom: coreState.uiState.shouldStickToBottom,
    sendMessage: coreState.ai.sendMessage,
    inputRef: coreState.uiState.inputRef,
    scrollToBottom,
  });
  const speechActions = createFloatingChatWidgetSpeechActions({
    saveSpeechConfig: coreState.speechProfiles.saveSpeechConfig,
    toast: coreState.toast,
    t: coreState.t,
  });

  return {
    derivedState,
    panelActions,
    messageActions,
    speechActions,
    scrollToBottom,
    handlePanelScroll,
  };
};

const buildFloatingChatWidgetState = () => {
  const coreState = createFloatingChatWidgetCoreState();
  const behaviorState = createFloatingChatWidgetBehaviorState(coreState);

  return {
    ...coreState,
    ...behaviorState,
  };
};

export function useFloatingChatWidget() {
  const state = buildFloatingChatWidgetState();

  useFloatingChatWidgetWatchers({
    showWidget: state.derivedState.showWidget,
    messages: state.ai.messages,
    isOpen: state.uiState.isOpen,
    isSpeechSettingsOpen: state.uiState.isSpeechSettingsOpen,
    unreadCount: state.uiState.unreadCount,
    renderedMessageSignature: state.derivedState.renderedMessageSignature,
    shouldStickToBottom: state.uiState.shouldStickToBottom,
    streaming: state.ai.streaming,
    loading: state.ai.loading,
    inputRef: state.uiState.inputRef,
    scrollToBottom: state.scrollToBottom,
  });

  useFloatingChatWidgetLifecycle({
    handleFocusChatShortcut: state.panelActions.handleFocusChatShortcut,
  });

  return createFloatingChatWidgetExposedState(state);
}
