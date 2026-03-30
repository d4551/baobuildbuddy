import { AI_CHAT_PAGE_PATH } from "@bao/shared";
import type { Ref } from "vue";
import { computed, onMounted, onUnmounted, watch } from "vue";
import type { useI18n } from "vue-i18n";
import {
  buildChatMessageRenderRows,
  createStreamingAssistantMessage,
  resolveLatestAssistantMessageIndex,
} from "~/utils/chat";

export const createWidgetScrollHandlers = (
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

export const useFloatingChatWidgetWatchers = (options: {
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

export const useFloatingChatWidgetLifecycle = (options: {
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

export const createFloatingChatWidgetDerivedState = (options: {
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
