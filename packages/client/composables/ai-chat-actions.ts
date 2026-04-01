import type { AIChatContext, AIChatContextSource, ChatMessage } from "@bao/shared/types/ai";
import { generateId } from "@bao/shared/utils/validation";
import type { ComposerTranslation } from "vue-i18n";
import { assertApiResponse, settlePromise, withLoadingState } from "~/composables/async-flow";
import { createChatMessage } from "~/utils/chat";

type AIChatResponse = {
  message?: string;
  id?: string;
  sessionId?: string;
  timestamp?: string;
};

interface SendMessageOptions {
  source?: AIChatContextSource;
}

interface ChatActionInput {
  api: ReturnType<typeof useApi>;
  t: ComposerTranslation;
  toast: ReturnType<typeof useNuxtApp>["$toast"];
  loading: ReturnType<typeof useState<boolean>>;
  streaming: ReturnType<typeof useState<boolean>>;
  messages: ReturnType<typeof useState<ChatMessage[]>>;
  sessionId: ReturnType<typeof useState<string>>;
  buildAssistantGreetingMessage: () => ChatMessage;
  buildCurrentContext: (source?: AIChatContextSource) => AIChatContext;
  unableToProcessFallback: () => string;
  requestErrorFallback: () => string;
}

function parseAIChatResponse(data: unknown): AIChatResponse {
  const response: AIChatResponse = {};
  if (!(data && typeof data === "object")) {
    return response;
  }

  if ("message" in data && typeof data.message === "string") {
    response.message = data.message;
  }
  if ("id" in data && typeof data.id === "string") {
    response.id = data.id;
  }
  if ("sessionId" in data && typeof data.sessionId === "string") {
    response.sessionId = data.sessionId;
  }
  if ("timestamp" in data && typeof data.timestamp === "string") {
    response.timestamp = data.timestamp;
  }

  return response;
}

async function requestAIChatResponse(
  input: ChatActionInput,
  content: string,
  source?: AIChatContextSource,
): Promise<AIChatResponse> {
  const userMessage = createChatMessage({
    role: "user",
    content,
    sessionId: input.sessionId.value,
    timestamp: new Date().toISOString(),
  });
  input.messages.value.push(userMessage);

  const { data, error } = await input.api.ai.chat.post({
    message: content,
    sessionId: input.sessionId.value,
    context: input.buildCurrentContext(source),
  });
  assertApiResponse(error, input.t("apiErrors.ai.sendMessageFailed"));

  const response = parseAIChatResponse(data);
  if (typeof response.sessionId === "string" && response.sessionId.length > 0) {
    input.sessionId.value = response.sessionId;
  }

  const assistantMessage = createChatMessage({
    role: "assistant",
    content: response.message || input.unableToProcessFallback(),
    id: response.id,
    sessionId: response.sessionId ?? input.sessionId.value,
    timestamp: response.timestamp ?? new Date().toISOString(),
  });
  input.messages.value.push(assistantMessage);

  return response;
}

export function createChatActions(input: ChatActionInput) {
  const sendMessage = async (content: string, options: SendMessageOptions = {}) => {
    input.streaming.value = true;
    const sendResult = await settlePromise(
      withLoadingState(input.loading, () => requestAIChatResponse(input, content, options.source)),
      input.t("aiChatCommon.requestErrorToast"),
    );
    input.streaming.value = false;

    if (!sendResult.ok) {
      input.toast.error(input.t("aiChatCommon.requestErrorToast"));
      input.messages.value.push(
        createChatMessage({
          role: "assistant",
          content: input.requestErrorFallback(),
          sessionId: input.sessionId.value,
          timestamp: new Date().toISOString(),
        }),
      );
      return null;
    }

    return sendResult.value;
  };

  const clearMessages = (): void => {
    input.sessionId.value = generateId();
    input.messages.value = [input.buildAssistantGreetingMessage()];
  };

  return {
    sendMessage,
    clearMessages,
  };
}
