import { APP_ROUTES } from "@bao/shared/constants/routes";
import type { AIChatContext, AIChatContextSource, ChatMessage } from "@bao/shared/types/ai";
import { generateId } from "@bao/shared/utils/validation";
import type { ComposerTranslation } from "vue-i18n";
import { assertApiResponse, settlePromise, withLoadingState } from "~/composables/async-flow";
import { useChatRealtime } from "~/composables/useChatRealtime";
import { parseJobApplyAutomationAction } from "~/utils/ai-automation-action";
import { createChatMessage } from "~/utils/chat";

type AIChatResponse = {
  message?: string;
  id?: string;
  sessionId?: string;
  timestamp?: string;
  provider?: string;
  model?: string;
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
  streamingContent: ReturnType<typeof useState<string>>;
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
  if ("provider" in data && typeof data.provider === "string") {
    response.provider = data.provider;
  }
  if ("model" in data && typeof data.model === "string") {
    response.model = data.model;
  }

  return response;
}

function pushUserMessage(input: ChatActionInput, content: string): void {
  input.messages.value.push(
    createChatMessage({
      role: "user",
      content,
      sessionId: input.sessionId.value,
      timestamp: new Date().toISOString(),
    }),
  );
}

function pushAssistantMessage(input: ChatActionInput, response: AIChatResponse): void {
  input.messages.value.push(
    createChatMessage({
      role: "assistant",
      content: response.message || input.unableToProcessFallback(),
      id: response.id,
      sessionId: response.sessionId ?? input.sessionId.value,
      timestamp: response.timestamp ?? new Date().toISOString(),
      provider: response.provider,
      model: response.model,
    }),
  );
}

async function requestAIChatResponseHttp(
  input: ChatActionInput,
  content: string,
  source?: AIChatContextSource,
): Promise<AIChatResponse> {
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
  pushAssistantMessage(input, response);
  return response;
}

async function requestAIChatResponseRealtime(
  input: ChatActionInput,
  content: string,
  chatRealtime: ReturnType<typeof useChatRealtime>,
): Promise<AIChatResponse | null> {
  input.streamingContent.value = "";
  const streamResult = await settlePromise(
    chatRealtime.sendStreamingMessage({
      content,
      sessionId: input.sessionId.value,
      onChunk: (chunk) => {
        input.streamingContent.value += chunk;
      },
      onSessionId: (sessionId) => {
        input.sessionId.value = sessionId;
      },
    }),
    input.t("aiChatCommon.requestErrorToast"),
  );
  if (!streamResult.ok) {
    return null;
  }
  const fullText = streamResult.value.fullText.trim();
  const response: AIChatResponse = {
    message: fullText.length > 0 ? fullText : input.unableToProcessFallback(),
    sessionId: streamResult.value.sessionId,
    timestamp: new Date().toISOString(),
  };
  input.sessionId.value = streamResult.value.sessionId;
  pushAssistantMessage(input, response);
  return response;
}

async function executeDetectedAutomationAction(
  input: ChatActionInput,
  response: AIChatResponse,
): Promise<void> {
  const action = parseJobApplyAutomationAction(response.message ?? "");
  if (!action) {
    return;
  }
  const { data, error } = await input.api.ai["automation-action"].post(action);
  if (error) {
    input.toast.error(input.t("aiChatCommon.automationActionFailed"));
    return;
  }
  const runId =
    data && typeof data === "object" && "runId" in data && typeof data.runId === "string"
      ? data.runId
      : "";
  if (!runId) {
    input.toast.error(input.t("aiChatCommon.automationActionFailed"));
    return;
  }
  input.toast.success(input.t("aiChatCommon.automationActionStarted", { runId }));
  input.messages.value.push(
    createChatMessage({
      role: "assistant",
      content: `${input.t("aiChatCommon.automationActionStarted", { runId })} ${input.t("aiChatCommon.automationActionOpenRuns")}: ${APP_ROUTES.automationRuns}`,
      sessionId: input.sessionId.value,
      timestamp: new Date().toISOString(),
    }),
  );
}

export function createChatActions(input: ChatActionInput) {
  const chatRealtime = useChatRealtime();

  const sendMessage = async (content: string, options: SendMessageOptions = {}) => {
    pushUserMessage(input, content);
    input.streaming.value = true;
    input.streamingContent.value = "";

    const realtimeResult = await settlePromise(
      withLoadingState(input.loading, () =>
        requestAIChatResponseRealtime(input, content, chatRealtime),
      ),
      input.t("aiChatCommon.requestErrorToast"),
    );

    let response: AIChatResponse | null = null;
    if (realtimeResult.ok && realtimeResult.value) {
      response = realtimeResult.value;
    } else {
      const httpResult = await settlePromise(
        withLoadingState(input.loading, () =>
          requestAIChatResponseHttp(input, content, options.source),
        ),
        input.t("aiChatCommon.requestErrorToast"),
      );
      if (httpResult.ok) {
        response = httpResult.value;
      }
    }

    input.streaming.value = false;
    input.streamingContent.value = "";

    if (!response) {
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

    await settlePromise(
      executeDetectedAutomationAction(input, response),
      input.t("aiChatCommon.automationActionFailed"),
    );
    return response;
  };

  const clearMessages = (): void => {
    input.sessionId.value = generateId();
    input.messages.value = [input.buildAssistantGreetingMessage()];
    input.streamingContent.value = "";
  };

  return {
    sendMessage,
    clearMessages,
  };
}
