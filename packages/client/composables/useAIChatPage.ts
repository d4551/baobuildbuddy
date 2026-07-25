import { onMounted, type Ref, ref } from "vue";
import { useI18n } from "vue-i18n";
import { createAIChatPageActions } from "~/composables/ai-chat-page-actions";
import { createAIChatPageDerivedState } from "~/composables/ai-chat-page-derived";
import { useAIChatPageScroll } from "~/composables/ai-chat-page-scroll";
import { CHAT_PAGE_CONTAINER_CLASS } from "~/constants/chat";

const createAIChatPageCoreState = () => {
  const { t, locale } = useI18n();
  const { resolvedBrand } = useBrand();
  const {
    messages,
    loading,
    streaming,
    streamingContent,
    sendMessage,
    clearMessages,
    buildCurrentContext,
  } = useAI();
  const { $toast } = useNuxtApp();
  const speech = useSpeechModelProfiles({ locale });
  const input = ref("");
  const chatContainer = useTemplateRef<HTMLElement>("aiChatContainer");
  const composerRef = useTemplateRef<HTMLTextAreaElement>("aiChatComposer");

  return {
    t,
    locale,
    resolvedBrand,
    messages,
    loading,
    streaming,
    streamingContent,
    sendMessage,
    clearMessages,
    buildCurrentContext,
    toast: $toast,
    speech,
    input,
    chatContainer,
    composerRef,
  };
};

const createAIChatPageVoiceState = (input: {
  readonly draft: Ref<string>;
  readonly messages: ReturnType<typeof useAI>["messages"];
}) => {
  const { locale } = useI18n();

  return useChatVoice({
    draft: input.draft,
    locale,
    messages: input.messages,
  });
};

const createAIChatPageState = (core: ReturnType<typeof createAIChatPageCoreState>) => {
  const voice = createAIChatPageVoiceState({
    draft: core.input,
    messages: core.messages,
  });
  const derived = createAIChatPageDerivedState({
    t: core.t,
    messages: core.messages,
    loading: core.loading,
    streaming: core.streaming,
    streamingContent: core.streamingContent,
    voiceErrorMessageKey: voice.errorMessageKey,
    buildCurrentContext: core.buildCurrentContext,
  });
  const scroll = useAIChatPageScroll({
    chatContainer: core.chatContainer,
    composerRef: core.composerRef,
    renderedMessageSignature: derived.renderedMessageSignature,
    loading: core.loading,
    streaming: core.streaming,
  });
  const actions = createAIChatPageActions({
    input: core.input,
    loading: core.loading,
    isVoiceListening: voice.isListening,
    stopListening: voice.stopListening,
    sendMessage: core.sendMessage,
    scrollToBottom: scroll.scrollToBottom,
    focusComposer: scroll.focusComposer,
    shouldStickToBottom: scroll.shouldStickToBottom,
    saveSpeechConfig: core.speech.saveSpeechConfig,
    toast: core.toast,
    t: core.t,
  });

  return {
    voice,
    derived,
    scroll,
    actions,
  };
};

export function useAIChatPage() {
  const core = createAIChatPageCoreState();
  const pageState = createAIChatPageState(core);

  onMounted(() => {
    pageState.scroll.scrollToBottom(true);
  });

  return {
    CHAT_PAGE_CONTAINER_CLASS,
    t: core.t,
    locale: core.locale,
    resolvedBrand: core.resolvedBrand,
    loading: core.loading,
    streaming: core.streaming,
    clearMessages: core.clearMessages,
    input: core.input,
    autoSpeakReplies: pageState.voice.autoSpeakReplies,
    canReplayAssistant: pageState.voice.canReplayAssistant,
    voiceSupportHintKey: pageState.voice.supportHintKey,
    voiceErrorLabel: pageState.derived.voiceErrorLabel,
    isVoiceListening: pageState.voice.isListening,
    isVoiceSpeaking: pageState.voice.isSpeaking,
    supportsRecognition: pageState.voice.supportsRecognition,
    supportsSynthesis: pageState.voice.supportsSynthesis,
    selectedVoiceId: pageState.voice.selectedVoiceId,
    availableVoices: pageState.voice.voices,
    speakLatestAssistantMessage: pageState.voice.speakLatestAssistantMessage,
    testOnDeviceTts: pageState.voice.testOnDeviceTts,
    toggleListening: pageState.voice.toggleListening,
    speechProviderOptions: core.speech.speechProviderOptions,
    speechConfig: core.speech.speechConfig,
    sttModelOptions: core.speech.sttModelOptions,
    ttsModelOptions: core.speech.ttsModelOptions,
    speechConfigSaving: core.speech.speechConfigSaving,
    isSpeechConfigDirty: core.speech.isSpeechConfigDirty,
    renderedMessages: pageState.derived.renderedMessages,
    latestAssistantMessageIndex: pageState.derived.latestAssistantMessageIndex,
    streamingBubble: pageState.derived.streamingBubble,
    hasConversation: pageState.derived.hasConversation,
    composerStatusLabel: pageState.derived.composerStatusLabel,
    contextChips: pageState.derived.contextChips,
    contextualPrompts: pageState.derived.contextualPrompts,
    currentContextLabel: pageState.derived.currentContextLabel,
    focusedEntityLabel: pageState.derived.focusedEntityLabel,
    handleChatScroll: pageState.scroll.handleChatScroll,
    handlePromptSelection: pageState.actions.handlePromptSelection,
    handleComposerKeydown: pageState.actions.handleComposerKeydown,
    handleSendMessage: pageState.actions.handleSendMessage,
    handleSaveSpeechConfig: pageState.actions.handleSaveSpeechConfig,
  };
}
