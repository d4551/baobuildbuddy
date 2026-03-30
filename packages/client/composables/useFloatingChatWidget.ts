import type { ChatMessage } from "@bao/shared";
import { AI_CHAT_PAGE_PATH } from "@bao/shared";
import type { Ref } from "vue";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { FLOATING_CHAT_PANEL_ID } from "~/constants/layout";
import {
  buildChatMessageRenderRows,
  createStreamingAssistantMessage,
  resolveLatestAssistantMessageIndex,
} from "~/utils/chat";
import { getErrorMessage } from "~/utils/errors";

const createWidgetScrollHandlers = (
  panelBodyRef: ReturnType<typeof useTemplateRef<HTMLElement>>,
  shouldStickToBottom: Ref<boolean>,
) => {
  const updateScrollStickiness = (): void => {
    const panelBody = panelBodyRef.value;
    if (!panelBody) return;
    const remainingScrollDistance =
      panelBody.scrollHeight - panelBody.scrollTop - panelBody.clientHeight;
    shouldStickToBottom.value = remainingScrollDistance <= 96;
  };

  const scrollToBottom = (force = false): void => {
    requestAnimationFrame(() => {
      const panelBody = panelBodyRef.value;
      if (!panelBody) return;
      if (!(force || shouldStickToBottom.value)) return;
      panelBody.scrollTop = panelBody.scrollHeight;
      updateScrollStickiness();
    });
  };

  const handlePanelScroll = (): void => {
    updateScrollStickiness();
  };

  return {
    updateScrollStickiness,
    scrollToBottom,
    handlePanelScroll,
  };
};

const createFloatingChatWidgetState = () => ({
  isOpen: ref(false),
  isSpeechSettingsOpen: ref(false),
  draft: ref(""),
  unreadCount: ref(0),
  panelBodyRef: useTemplateRef<HTMLElement>("floatingChatPanelBody"),
  inputRef: useTemplateRef<HTMLTextAreaElement>("floatingChatInput"),
  shouldStickToBottom: ref(true),
});

const useFloatingChatWidgetWatchers = (options: {
  showWidget: Readonly<Ref<boolean>>;
  messages: ReturnType<typeof useAI>["messages"];
  isOpen: Ref<boolean>;
  isSpeechSettingsOpen: Ref<boolean>;
  unreadCount: Ref<number>;
  renderedMessageSignature: Readonly<Ref<string>>;
  shouldStickToBottom: Ref<boolean>;
  streaming: ReturnType<typeof useAI>["streaming"];
  loading: ReturnType<typeof useAI>["loading"];
  inputRef: ReturnType<typeof useTemplateRef<HTMLTextAreaElement>>;
  scrollToBottom: (force?: boolean) => void;
}) => {
  watch(options.showWidget, (visible) => {
    if (!visible) {
      options.isOpen.value = false;
      options.isSpeechSettingsOpen.value = false;
      options.unreadCount.value = 0;
    }
  });

  watch(
    () => options.messages.value.length,
    (nextCount, previousCount) => {
      if (options.isOpen.value) {
        options.unreadCount.value = 0;
        options.scrollToBottom(true);
        return;
      }

      if (nextCount > previousCount) {
        options.unreadCount.value += nextCount - previousCount;
      }
    },
  );

  watch(options.renderedMessageSignature, () => {
    if (!options.isOpen.value) {
      return;
    }

    if (options.shouldStickToBottom.value || options.streaming.value || options.loading.value) {
      options.scrollToBottom(true);
    }
  });

  watch(options.streaming, () => {
    if (options.streaming.value && options.isOpen.value) {
      options.shouldStickToBottom.value = true;
      options.scrollToBottom(true);
    }
  });

  watch(options.isOpen, (open) => {
    if (!open) {
      options.isSpeechSettingsOpen.value = false;
      return;
    }
    options.unreadCount.value = 0;
    options.shouldStickToBottom.value = true;
    options.scrollToBottom(true);
    requestAnimationFrame(() => {
      options.inputRef.value?.focus();
    });
  });
};

const createFloatingChatWidgetPanelActions = (options: {
  isOpen: Ref<boolean>;
  isSpeechSettingsOpen: Ref<boolean>;
  unreadCount: Ref<number>;
  inputRef: ReturnType<typeof useTemplateRef<HTMLTextAreaElement>>;
}) => {
  const toggleWidget = () => {
    options.isOpen.value = !options.isOpen.value;
  };

  const closeWidget = () => {
    options.isOpen.value = false;
  };

  const toggleSpeechSettings = (): void => {
    options.isSpeechSettingsOpen.value = !options.isSpeechSettingsOpen.value;
  };

  const handleFocusChatShortcut = () => {
    options.isOpen.value = true;
    options.unreadCount.value = 0;
    requestAnimationFrame(() => {
      options.inputRef.value?.focus();
    });
  };

  return {
    toggleWidget,
    closeWidget,
    toggleSpeechSettings,
    handleFocusChatShortcut,
  };
};

const createFloatingChatWidgetMessageActions = (options: {
  draft: Ref<string>;
  loading: ReturnType<typeof useAI>["loading"];
  isVoiceListening: Readonly<Ref<boolean>>;
  stopListening: () => void;
  shouldStickToBottom: Ref<boolean>;
  sendMessage: ReturnType<typeof useAI>["sendMessage"];
  inputRef: ReturnType<typeof useTemplateRef<HTMLTextAreaElement>>;
  scrollToBottom: (force?: boolean) => void;
}) => {
  const handleSendMessage = async () => {
    if (!options.draft.value.trim() || options.loading.value) return;

    if (options.isVoiceListening.value) {
      options.stopListening();
    }

    options.shouldStickToBottom.value = true;
    const content = options.draft.value.trim();
    options.draft.value = "";
    await options.sendMessage(content, { source: "floating-widget" });
    options.scrollToBottom(true);
  };

  const handlePromptInput = (prompt: string): void => {
    options.draft.value = prompt;
    requestAnimationFrame(() => {
      options.inputRef.value?.focus();
    });
  };

  const handleDraftKeydown = async (event: KeyboardEvent): Promise<void> => {
    if (event.key !== "Enter" || event.shiftKey || event.isComposing) {
      return;
    }

    event.preventDefault();
    await handleSendMessage();
  };

  return {
    handleSendMessage,
    handlePromptInput,
    handleDraftKeydown,
  };
};

const createFloatingChatWidgetSpeechActions = (options: {
  saveSpeechConfig: ReturnType<typeof useSpeechModelProfiles>["saveSpeechConfig"];
  toast: ReturnType<typeof useNuxtApp>["$toast"];
  t: ReturnType<typeof useI18n>["t"];
}) => {
  const handleSaveSpeechConfig = async (): Promise<void> => {
    const saveSpeechResult = await options.saveSpeechConfig(
      options.t("floatingChat.voiceSettings.saveErrorFallback"),
    );
    if (!saveSpeechResult.ok) {
      options.toast.error(
        getErrorMessage(
          saveSpeechResult.error,
          options.t("floatingChat.voiceSettings.saveErrorFallback"),
        ),
      );
      return;
    }

    if (!saveSpeechResult.saved) {
      return;
    }

    options.toast.success(options.t("floatingChat.voiceSettings.saveSuccess"));
  };

  return {
    handleSaveSpeechConfig,
  };
};

const useFloatingChatWidgetLifecycle = (options: {
  ensureSpeechConfigLoaded: ReturnType<typeof useSpeechModelProfiles>["ensureSpeechConfigLoaded"];
  handleFocusChatShortcut: () => void;
}) => {
  onMounted(async () => {
    await options.ensureSpeechConfigLoaded();
    window.addEventListener("bao:focus-chat", options.handleFocusChatShortcut);
  });

  onUnmounted(() => {
    window.removeEventListener("bao:focus-chat", options.handleFocusChatShortcut);
  });
};

const createFloatingChatWidgetDerivedState = (options: {
  messages: ReturnType<typeof useAI>["messages"];
  streaming: ReturnType<typeof useAI>["streaming"];
  route: ReturnType<typeof useRoute>;
  buildCurrentContext: ReturnType<typeof useAI>["buildCurrentContext"];
  t: ReturnType<typeof useI18n>["t"];
  voiceErrorMessageKey: Readonly<Ref<string>>;
}) => {
  const voiceErrorLabel = computed(() => {
    if (options.voiceErrorMessageKey.value.length === 0) {
      return "";
    }

    return options.t("aiChatCommon.voice.errorLabel", {
      error: options.t(options.voiceErrorMessageKey.value),
    });
  });
  const chatContext = computed(() => options.buildCurrentContext("floating-widget"));
  const renderedMessages = computed(() => buildChatMessageRenderRows(options.messages.value));
  const renderedMessageSignature = computed(() =>
    renderedMessages.value
      .map(({ message }) => [message.id, message.role, message.timestamp, message.content].join(":"))
      .join("\n"),
  );
  const latestAssistantMessageIndex = computed(() =>
    resolveLatestAssistantMessageIndex(options.messages.value),
  );
  const streamingBubble = computed(() => createStreamingAssistantMessage("floatingWidget"));
  const { contextChips, contextualPrompts, currentContextLabel, focusedEntityLabel } =
    useAIChatContextSummary(chatContext, options.t);
  const hasConversation = computed(
    () => renderedMessages.value.length > 0 || options.streaming.value,
  );
  const showWidget = computed(() => !options.route.path.startsWith(AI_CHAT_PAGE_PATH));

  return {
    voiceErrorLabel,
    renderedMessages,
    renderedMessageSignature,
    latestAssistantMessageIndex,
    streamingBubble,
    contextChips,
    contextualPrompts,
    currentContextLabel,
    focusedEntityLabel,
    hasConversation,
    showWidget,
  };
};

const createFloatingChatWidgetCoreState = () => {
  const route = useRoute();
  const ai = useAI();
  const { $toast } = useNuxtApp();
  const { t, locale } = useI18n();
  const { resolvedBrand } = useBrand();
  const uiState = createFloatingChatWidgetState();
  const typedMessages = computed<ChatMessage[]>(() => [...ai.messages.value]);
  const speechProfiles = useSpeechModelProfiles({ locale });
  const voice = useChatVoice({
    draft: uiState.draft,
    locale,
    messages: typedMessages,
  });

  return {
    route,
    ai,
    toast: $toast,
    t,
    locale,
    resolvedBrand,
    uiState,
    speechProfiles,
    voice,
  };
};

const createFloatingChatWidgetBehaviorState = (
  coreState: ReturnType<typeof createFloatingChatWidgetCoreState>,
) => {
  const derivedState = createFloatingChatWidgetDerivedState({
    messages: coreState.ai.messages,
    streaming: coreState.ai.streaming,
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

const createFloatingChatWidgetUiExposedState = (
  state: ReturnType<typeof buildFloatingChatWidgetState>,
) => {
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

const createFloatingChatWidgetSpeechExposedState = (
  state: ReturnType<typeof buildFloatingChatWidgetState>,
) => {
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

const createFloatingChatWidgetExposedState = (
  state: ReturnType<typeof buildFloatingChatWidgetState>,
) => {
  return {
    ...createFloatingChatWidgetUiExposedState(state),
    ...createFloatingChatWidgetSpeechExposedState(state),
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
    ensureSpeechConfigLoaded: state.speechProfiles.ensureSpeechConfigLoaded,
    handleFocusChatShortcut: state.panelActions.handleFocusChatShortcut,
  });

  return createFloatingChatWidgetExposedState(state);
}
