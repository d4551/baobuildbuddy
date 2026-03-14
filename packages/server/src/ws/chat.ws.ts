import {
  AI_DEFAULT_TEMPERATURE_CREATIVE,
  API_ERROR_GENERATE_RESPONSE,
  AI_MAX_TOKENS_WS,
  APP_BRAND,
  generateId,
  safeParseJson,
  SCHEMA_MAX_LENGTH_ID,
  SCHEMA_MAX_LENGTH_MESSAGE,
  settle,
  toApiScopedPath,
  WS_ENDPOINTS,
} from "@bao/shared";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../db/client";
import { chatHistory } from "../db/schema/chat-history";
import { DEFAULT_SETTINGS_ID, settings } from "../db/schema/settings";
import type { AIService } from "../services/ai/ai-service";
import { contextManager } from "../services/ai/context-manager";

type AIServiceInstance = AIService;
type SettingsRow = typeof settings.$inferSelect;
type ChatContext = Awaited<ReturnType<typeof contextManager.buildContext>>;
type ChatSocket = { send: (data: string) => void };
type ChatMessage = {
  content: string;
  sessionId?: string;
};
type StreamAssistantResponseInput = {
  socket: ChatSocket;
  aiService: AIServiceInstance;
  input: string;
  context: ChatContext;
  sessionId: string;
};

type AutomationActionPayload = {
  action: string;
  jobUrl?: string;
  resumeId?: string;
  coverLetterId?: string;
};

const JOB_APPLY_ACTION_PATTERN = /\{"action"\s*:\s*"job_apply"[^{}]*\}/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseAutomationActionPayload(raw: string): AutomationActionPayload | null {
  const parsed = safeParseJson(raw);
  if (!isRecord(parsed)) {
    return null;
  }

  if (typeof parsed.action !== "string") {
    return null;
  }

  return {
    action: parsed.action,
    ...(typeof parsed.jobUrl === "string" ? { jobUrl: parsed.jobUrl } : {}),
    ...(typeof parsed.resumeId === "string" ? { resumeId: parsed.resumeId } : {}),
    ...(typeof parsed.coverLetterId === "string" ? { coverLetterId: parsed.coverLetterId } : {}),
  };
}

function sendSocketPayload(socket: ChatSocket, payload: Record<string, unknown>): void {
  socket.send(JSON.stringify(payload));
}

function sendChatError(socket: ChatSocket, sessionId: string): void {
  sendSocketPayload(socket, {
    type: "error",
    message: API_ERROR_GENERATE_RESPONSE,
    sessionId,
  });
}

async function saveChatMessage(
  role: "user" | "assistant",
  content: string,
  sessionId: string,
): Promise<void> {
  await db.insert(chatHistory).values({
    id: generateId(),
    role,
    content,
    timestamp: new Date().toISOString(),
    sessionId,
  });
}

async function getSettingsRow(): Promise<SettingsRow | undefined> {
  const rows = await db.select().from(settings).where(eq(settings.id, DEFAULT_SETTINGS_ID));
  return rows[0];
}

async function createAiService(config: SettingsRow | undefined): Promise<AIServiceInstance> {
  const { AIService } = await import("../services/ai/ai-service");
  return AIService.fromSettings(config);
}

function getAutomationActionMessage(
  streamedText: string,
  sessionId: string,
): Record<string, unknown> | null {
  const actionMatch = streamedText.match(JOB_APPLY_ACTION_PATTERN);
  if (!actionMatch) {
    return null;
  }

  const action = parseAutomationActionPayload(actionMatch[0]);
  if (!action) {
    return {
      type: "automation_action_detected",
      action: null,
      sessionId,
      parseError: true,
    };
  }

  const isValidAction =
    action.action === "job_apply" && Boolean(action.jobUrl) && Boolean(action.resumeId);
  return {
    type: "automation_action_detected",
    action: isValidAction ? action : null,
    sessionId,
  };
}

async function streamAssistantResponse({
  socket,
  aiService,
  input,
  context,
  sessionId,
}: StreamAssistantResponseInput): Promise<string> {
  let streamedText = "";
  sendSocketPayload(socket, { type: "stream_start", sessionId });

  const generator = aiService.stream(input, {
    systemPrompt: context.systemPrompt,
    messages: context.messages,
    temperature: AI_DEFAULT_TEMPERATURE_CREATIVE,
    maxTokens: AI_MAX_TOKENS_WS,
  });

  for await (const { chunk } of generator) {
    streamedText += chunk;
    sendSocketPayload(socket, { type: "stream_chunk", chunk, sessionId });
  }

  const domain = contextManager.inferDomain(input);
  const followUps = contextManager.generateFollowUps(domain);
  sendSocketPayload(socket, { type: "stream_end", sessionId, followUps });

  const automationActionPayload = getAutomationActionMessage(streamedText, sessionId);
  if (automationActionPayload) {
    sendSocketPayload(socket, automationActionPayload);
  }

  return streamedText;
}

async function handleChatMessage(socket: ChatSocket, data: ChatMessage): Promise<void> {
  const sessionId = data.sessionId || generateId();
  await saveChatMessage("user", data.content, sessionId);

  sendSocketPayload(socket, { type: "message_received", sessionId });

  const settingsResult = await settle(getSettingsRow());
  if (settingsResult.status === "rejected") {
    sendChatError(socket, sessionId);
    return;
  }

  const aiService = await createAiService(settingsResult.value);
  const contextResult = await settle(contextManager.buildContext(sessionId, data.content));
  const responseText =
    contextResult.status === "fulfilled"
      ? await streamAssistantResponse({
          socket,
          aiService,
          input: data.content,
          context: contextResult.value,
          sessionId,
        })
      : generateFallbackResponse(data.content);

  if (contextResult.status === "rejected") {
    sendSocketPayload(socket, { type: "response", content: responseText, sessionId });
  }

  const persistResult = await settle(saveChatMessage("assistant", responseText, sessionId));
  if (persistResult.status === "rejected") {
    sendChatError(socket, sessionId);
  }
}

export const chatWebSocket = new Elysia().ws(toApiScopedPath(WS_ENDPOINTS.chat), {
  body: t.Object({
    content: t.String({ maxLength: SCHEMA_MAX_LENGTH_MESSAGE }),
    sessionId: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
  }),
  open(ws) {
    sendSocketPayload(ws, {
      type: "connected",
      message: `Connected to ${APP_BRAND.assistantName} AI chat`,
    });
  },
  async message(ws, data) {
    await handleChatMessage(ws, data);
  },
  close() {
    // Connection closed
  },
});

function generateFallbackResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("resume")) {
    return "I can help with your resume! Head to the Resume Builder to create or enhance your resume. Once you configure an AI provider, I can offer personalized suggestions.";
  }
  if (lower.includes("job") || lower.includes("work") || lower.includes("career")) {
    return "Check out the Job Board to browse gaming industry opportunities! I can help match you with the right roles once an AI provider is configured.";
  }
  if (lower.includes("interview")) {
    return "The Interview Prep section lets you practice with AI-powered mock interviews tailored to specific studios. Configure an AI provider to get started!";
  }
  if (
    lower.includes("automate") ||
    lower.includes("automation") ||
    lower.includes("rpa") ||
    lower.includes("auto-apply") ||
    lower.includes("auto apply")
  ) {
    return "I can help automate job applications! Head to the Automation page to set up an RPA run, or configure an AI provider so I can guide you through the process right here in chat.";
  }
  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
    return `Hello! I'm ${APP_BRAND.assistantName}, your AI career assistant for the game industry. I can help with resumes, job searching, interview prep, and skill mapping. What would you like to work on?`;
  }
  return `I'm ${APP_BRAND.assistantName}, your game industry career assistant! Configure an AI provider in Settings to unlock my full capabilities. I can help with resumes, job matching, interview prep, and more.`;
}
