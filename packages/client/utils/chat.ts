import type { ChatMessage } from "@bao/shared";
import { generateId } from "@bao/shared";

/** Render-ready chat row with a stable key and normalized payload. */
export interface ChatMessageRenderRow {
  message: ChatMessage;
  key: string;
}

/** Timestamp format used across chat bubbles. */
const CHAT_MESSAGE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: "numeric",
  minute: "2-digit",
};

/** Stable IDs for streaming placeholders across chat surfaces. */
export const AI_CHAT_STREAMING_MESSAGE_IDS = {
  chatPage: "ai-chat-page-streaming",
  floatingWidget: "floating-chat-streaming",
} as const;

type ChatStreamingContext = keyof typeof AI_CHAT_STREAMING_MESSAGE_IDS;

/** Locale fallback when the active locale is unavailable. */
function resolveLocaleFallback(locale?: string): string {
  if (locale && locale.trim().length > 0) {
    return locale;
  }

  return Intl.DateTimeFormat().resolvedOptions().locale || "en-US";
}

/** Resolve a chat message bubble from a raw role and content with a stable ID. */
export function createChatMessage(params: {
  role: ChatMessage["role"];
  content: string;
  timestamp?: string;
  sessionId?: string;
  id?: string;
}): ChatMessage {
  return {
    id: params.id ?? generateId(),
    role: params.role,
    content: params.content,
    timestamp: params.timestamp ?? new Date().toISOString(),
    ...(params.sessionId ? { sessionId: params.sessionId } : {}),
  };
}

/** Create a stable streaming placeholder bubble for a given chat context. */
export function createStreamingAssistantMessage(context: ChatStreamingContext): ChatMessage {
  return createChatMessage({
    role: "assistant",
    id: AI_CHAT_STREAMING_MESSAGE_IDS[context],
    content: "",
  });
}

/**
 * Build chat rows with stable keys for deterministic rendering and no drift during
 * streaming or rerender cycles.
 */
export function buildChatMessageRenderRows(
  messages: readonly ChatMessage[],
): ChatMessageRenderRow[] {
  return messages.map((message, index) => ({
    message,
    key: message.id ?? `${message.role}-${message.timestamp ?? "no-timestamp"}-${index}`,
  }));
}

/**
 * Resolve the index of the latest assistant message in a message list.
 */
export function resolveLatestAssistantMessageIndex(messages: readonly ChatMessage[]): number {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index]?.role === "assistant") {
      return index;
    }
  }

  return -1;
}

/**
 * Format a chat timestamp for the active locale and return an empty string for invalid values.
 */
export function formatChatTimestamp(timestamp: string | undefined, locale?: string): string {
  if (!timestamp) {
    return "";
  }

  const parsedDate = new Date(timestamp);
  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toLocaleTimeString(resolveLocaleFallback(locale), CHAT_MESSAGE_TIME_OPTIONS);
}
