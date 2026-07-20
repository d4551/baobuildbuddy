import type { ChatMessage } from "@bao/shared/types/ai";
import { computed } from "vue";
import {
  buildChatMessageRenderRows,
  createStreamingAssistantMessage,
  resolveLatestAssistantMessageIndex,
} from "~/utils/chat";

type AIChatTranslate = (key: string, params?: Record<string, unknown>) => string;

export const createAIChatPageDerivedState = (input: {
  readonly t: AIChatTranslate;
  readonly messages: Readonly<Ref<readonly ChatMessage[]>>;
  readonly loading: Readonly<Ref<boolean>>;
  readonly streaming: Readonly<Ref<boolean>>;
  readonly streamingContent: Readonly<Ref<string>>;
  readonly voiceErrorMessageKey: Readonly<Ref<string>>;
  readonly buildCurrentContext: ReturnType<typeof useAI>["buildCurrentContext"];
}) => {
  const voiceErrorLabel = computed(() => {
    if (input.voiceErrorMessageKey.value.length === 0) {
      return "";
    }

    return input.t("aiChatCommon.voice.errorLabel", {
      error: input.t(input.voiceErrorMessageKey.value),
    });
  });
  const renderedMessages = computed(() => buildChatMessageRenderRows([...input.messages.value]));
  const renderedMessageSignature = computed(() =>
    renderedMessages.value
      .map(({ message }) =>
        [message.id, message.role, message.timestamp, message.content].join(":"),
      )
      .join("\n"),
  );
  const latestAssistantMessageIndex = computed(() =>
    resolveLatestAssistantMessageIndex([...input.messages.value]),
  );
  const streamingBubble = computed(() =>
    createStreamingAssistantMessage("chatPage", input.streamingContent.value),
  );
  const chatContext = computed(() => input.buildCurrentContext("chat-page"));
  const hasConversation = computed(
    () => renderedMessages.value.length > 0 || input.streaming.value,
  );
  const composerStatusLabel = computed(() =>
    input.loading.value || input.streaming.value
      ? input.t("aiChatPage.composerBusyStatus")
      : input.t("aiChatPage.composerIdleStatus"),
  );
  const contextSummary = useAIChatContextSummary(chatContext, input.t);

  return {
    voiceErrorLabel,
    renderedMessages,
    renderedMessageSignature,
    latestAssistantMessageIndex,
    streamingBubble,
    hasConversation,
    composerStatusLabel,
    contextChips: contextSummary.contextChips,
    contextualPrompts: contextSummary.contextualPrompts,
    currentContextLabel: contextSummary.currentContextLabel,
    focusedEntityLabel: contextSummary.focusedEntityLabel,
  };
};
