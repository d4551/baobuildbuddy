import type { ChatMessage } from "@bao/shared";
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { CHAT_PAGE_CONTAINER_CLASS } from "~/constants/chat";
import {
  buildChatMessageRenderRows,
  createStreamingAssistantMessage,
  resolveLatestAssistantMessageIndex,
} from "~/utils/chat";
import { getErrorMessage } from "~/utils/errors";

const CHAT_SCROLL_STICKY_THRESHOLD_PX = 96;

export function useAIChatPage() {
  const { t, locale } = useI18n();
  const { resolvedBrand } = useBrand();

  if (import.meta.server) {
    useServerSeoMeta({
      title: t("aiChatPage.seoTitle", { brand: resolvedBrand.value.name }),
      description: t("aiChatPage.seoDescription"),
    });
  }

  const { messages, loading, streaming, sendMessage, clearMessages, buildCurrentContext } = useAI();
  const { $toast } = useNuxtApp();
  const {
    speechProviderOptions,
    speechConfig,
    sttModelOptions,
    ttsModelOptions,
    speechConfigSaving,
    isSpeechConfigDirty,
    ensureSpeechConfigLoaded,
    saveSpeechConfig,
  } = useSpeechModelProfiles({ locale });

  const input = ref("");
  const chatContainer = useTemplateRef<HTMLElement>("aiChatContainer");
  const composerRef = useTemplateRef<HTMLTextAreaElement>("aiChatComposer");
  const shouldStickToBottom = ref(true);
  const typedMessages = computed<ChatMessage[]>(() => [...messages.value]);

  const {
    autoSpeakReplies,
    canReplayAssistant,
    errorMessageKey: voiceErrorMessageKey,
    supportHintKey: voiceSupportHintKey,
    isListening: isVoiceListening,
    isSpeaking: isVoiceSpeaking,
    supportsRecognition,
    supportsSynthesis,
    selectedVoiceId,
    voices: availableVoices,
    speakLatestAssistantMessage,
    stopListening,
    toggleListening,
  } = useChatVoice({
    draft: input,
    locale,
    messages: typedMessages,
  });

  const voiceErrorLabel = computed(() => {
    if (voiceErrorMessageKey.value.length === 0) {
      return "";
    }

    return t("aiChatCommon.voice.errorLabel", { error: t(voiceErrorMessageKey.value) });
  });
  const renderedMessages = computed(() => buildChatMessageRenderRows(typedMessages.value));
  const renderedMessageSignature = computed(() =>
    renderedMessages.value
      .map(({ message }) => [message.id, message.role, message.timestamp, message.content].join(":"))
      .join("\n"),
  );
  const latestAssistantMessageIndex = computed(() =>
    resolveLatestAssistantMessageIndex(typedMessages.value),
  );
  const streamingBubble = computed(() => createStreamingAssistantMessage("chatPage"));
  const chatContext = computed(() => buildCurrentContext("chat-page"));
  const hasConversation = computed(() => renderedMessages.value.length > 0 || streaming.value);
  const composerStatusLabel = computed(() =>
    loading.value || streaming.value
      ? t("aiChatPage.composerBusyStatus")
      : t("aiChatPage.composerIdleStatus"),
  );
  const { contextChips, contextualPrompts, currentContextLabel, focusedEntityLabel } =
    useAIChatContextSummary(chatContext, t);

  const updateScrollStickiness = (): void => {
    const container = chatContainer.value;
    if (!container) {
      return;
    }

    const remainingScrollDistance =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    shouldStickToBottom.value = remainingScrollDistance <= CHAT_SCROLL_STICKY_THRESHOLD_PX;
  };

  const scrollToBottom = (force = false): void => {
    requestAnimationFrame(() => {
      const container = chatContainer.value;
      if (!container || (!force && !shouldStickToBottom.value)) {
        return;
      }

      container.scrollTop = container.scrollHeight;
      updateScrollStickiness();
    });
  };

  watch(renderedMessageSignature, () => {
    if (shouldStickToBottom.value || loading.value || streaming.value) {
      scrollToBottom(true);
    }
  });

  watch(streaming, (isStreaming) => {
    if (!isStreaming) {
      return;
    }

    shouldStickToBottom.value = true;
    scrollToBottom(true);
  });

  const handleChatScroll = (): void => {
    updateScrollStickiness();
  };

  const focusComposer = (): void => {
    requestAnimationFrame(() => {
      composerRef.value?.focus();
    });
  };

  const handlePromptSelection = (prompt: string): void => {
    input.value = prompt;
    focusComposer();
  };

  const handleSendMessage = async (): Promise<void> => {
    if (!input.value.trim() || loading.value) return;

    if (isVoiceListening.value) {
      stopListening();
    }

    shouldStickToBottom.value = true;
    const content = input.value.trim();
    input.value = "";
    await sendMessage(content, { source: "chat-page" });
    scrollToBottom(true);
  };

  const handleComposerKeydown = async (event: KeyboardEvent): Promise<void> => {
    if (event.key !== "Enter" || event.shiftKey || event.isComposing) {
      return;
    }

    event.preventDefault();
    await handleSendMessage();
  };

  const handleSaveSpeechConfig = async (): Promise<void> => {
    const saveSpeechResult = await saveSpeechConfig(t("aiChatPage.voiceSettings.saveErrorFallback"));
    if (!saveSpeechResult.ok) {
      $toast.error(
        getErrorMessage(saveSpeechResult.error, t("aiChatPage.voiceSettings.saveErrorFallback")),
      );
      return;
    }

    if (!saveSpeechResult.saved) {
      return;
    }

    $toast.success(t("aiChatPage.voiceSettings.saveSuccess"));
  };

  onMounted(async () => {
    await ensureSpeechConfigLoaded();
    scrollToBottom(true);
  });

  return {
    CHAT_PAGE_CONTAINER_CLASS,
    t,
    locale,
    resolvedBrand,
    messages,
    loading,
    streaming,
    clearMessages,
    input,
    chatContainer,
    composerRef,
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
    speechConfig,
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
  };
}
