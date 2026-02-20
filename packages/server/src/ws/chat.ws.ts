import { APP_BRAND, generateId, safeParseJson } from "@bao/shared";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../db/client";
import { chatHistory } from "../db/schema/chat-history";
import { DEFAULT_SETTINGS_ID, settings } from "../db/schema/settings";
import { contextManager } from "../services/ai/context-manager";

type AutomationActionPayload = {
  action: string;
  jobUrl?: string;
  resumeId?: string;
  coverLetterId?: string;
};

function parseAutomationActionPayload(raw: string): AutomationActionPayload | null {
  const parsed = safeParseJson(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }
  const parsedRecord = parsed as Record<string, unknown>;

  if (typeof parsedRecord.action !== "string") {
    return null;
  }

  return {
    action: parsedRecord.action,
    ...(typeof parsedRecord.jobUrl === "string" ? { jobUrl: parsedRecord.jobUrl } : {}),
    ...(typeof parsedRecord.resumeId === "string" ? { resumeId: parsedRecord.resumeId } : {}),
    ...(typeof parsedRecord.coverLetterId === "string"
      ? { coverLetterId: parsedRecord.coverLetterId }
      : {}),
  };
}

export const chatWebSocket = new Elysia().ws("/ws/chat", {
  body: t.Object({
    content: t.String({ maxLength: 10000 }),
    sessionId: t.Optional(t.String({ maxLength: 100 })),
  }),
  async open(ws) {
    ws.send(
      JSON.stringify({
        type: "connected",
        message: `Connected to ${APP_BRAND.assistantName} AI chat`,
      }),
    );
  },
  async message(ws, data) {
    const sessionId = data.sessionId || generateId();

    // Save user message
    await db.insert(chatHistory).values({
      id: generateId(),
      role: "user",
      content: data.content,
      timestamp: new Date().toISOString(),
      sessionId,
    });

    // Send acknowledgement
    ws.send(
      JSON.stringify({
        type: "message_received",
        sessionId,
      }),
    );

    return db
      .select()
      .from(settings)
      .where(eq(settings.id, DEFAULT_SETTINGS_ID))
      .then(async (settingsRows) => {
        const config = settingsRows[0];
        const { AIService } = await import("../services/ai/ai-service");
        const aiService = AIService.fromSettings(config);

        return contextManager
          .buildContext(sessionId, data.content)
          .then(async ({ systemPrompt, messages }) => {
            let responseText = "";
            ws.send(JSON.stringify({ type: "stream_start", sessionId }));

            const generator = aiService.stream(data.content, {
              systemPrompt,
              messages,
              temperature: 0.7,
              maxTokens: 2048,
            });

            for await (const { chunk } of generator) {
              responseText += chunk;
              ws.send(
                JSON.stringify({
                  type: "stream_chunk",
                  chunk,
                  sessionId,
                }),
              );
            }

            const domain = contextManager.inferDomain(data.content);
            const followUps = contextManager.generateFollowUps(domain);

            ws.send(
              JSON.stringify({
                type: "stream_end",
                sessionId,
                followUps,
              }),
            );

            const actionMatch = responseText.match(/\{"action"\s*:\s*"job_apply"[^{}]*\}/);
            if (actionMatch) {
              const action = parseAutomationActionPayload(actionMatch[0]);
              if (!action) {
                ws.send(
                  JSON.stringify({
                    type: "automation_action_detected",
                    action: null,
                    sessionId,
                    parseError: true,
                  }),
                );
              } else {
                const isValidAction =
                  action.action === "job_apply" && !!action.jobUrl && !!action.resumeId;
                ws.send(
                  JSON.stringify({
                    type: "automation_action_detected",
                    action: isValidAction ? action : null,
                    sessionId,
                  }),
                );
              }
            }

            return responseText;
          })
          .catch(() => {
            const fallback = generateFallbackResponse(data.content);
            ws.send(
              JSON.stringify({
                type: "response",
                content: fallback,
                sessionId,
              }),
            );
            return fallback;
          });
      })
      .then(async (responseText) => {
        await db.insert(chatHistory).values({
          id: generateId(),
          role: "assistant",
          content: responseText,
          timestamp: new Date().toISOString(),
          sessionId,
        });
      })
      .catch(() => {
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Failed to generate response",
            sessionId,
          }),
        );
      });
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
