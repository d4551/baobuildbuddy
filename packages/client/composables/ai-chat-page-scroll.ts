const CHAT_SCROLL_STICKY_THRESHOLD_PX = 96;

export const useAIChatPageScroll = (input: {
  readonly chatContainer: ReturnType<typeof useTemplateRef<HTMLElement>>;
  readonly composerRef: ReturnType<typeof useTemplateRef<HTMLTextAreaElement>>;
  readonly renderedMessageSignature: Readonly<Ref<string>>;
  readonly loading: Readonly<Ref<boolean>>;
  readonly streaming: Readonly<Ref<boolean>>;
}) => {
  const shouldStickToBottom = ref(true);

  const updateScrollStickiness = (): void => {
    const container = input.chatContainer.value;
    if (!container) {
      return;
    }

    const remainingScrollDistance =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    shouldStickToBottom.value = remainingScrollDistance <= CHAT_SCROLL_STICKY_THRESHOLD_PX;
  };

  const scrollToBottom = (force = false): void => {
    requestAnimationFrame(() => {
      const container = input.chatContainer.value;
      if (!(container && (force || shouldStickToBottom.value))) {
        return;
      }

      container.scrollTop = container.scrollHeight;
      updateScrollStickiness();
    });
  };

  watch(input.renderedMessageSignature, () => {
    if (shouldStickToBottom.value || input.loading.value || input.streaming.value) {
      scrollToBottom(true);
    }
  });

  watch(input.streaming, (isStreaming) => {
    if (!isStreaming) {
      return;
    }

    shouldStickToBottom.value = true;
    scrollToBottom(true);
  });

  return {
    handleChatScroll: updateScrollStickiness,
    focusComposer: () => requestAnimationFrame(() => input.composerRef.value?.focus()),
    scrollToBottom,
    shouldStickToBottom,
  };
};
