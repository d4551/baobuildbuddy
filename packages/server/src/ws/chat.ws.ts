import { APP_BRAND, generateId } from "@navi/shared";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../db/client";
import { chatHistory } from "../db/schema/chat-history";
import { settings } from "../db/schema/settings";
import { contextManager } from "../services/ai/context-manager";

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

    try {
      // Load settings to get AI provider config
      const settingsRows = await db.select().from(settings).where(eq(settings.id, "default"));
      const config = settingsRows[0];
      const { AIService } = await import("../services/ai/ai-service");
      const aiService = AIService.fromSettings(config);
      let responseText = "";

      try {
        // Build context-aware prompt using ConversationContextManager
        const { systemPrompt, messages } = await contextManager.buildContext(
          sessionId,
          data.content,
        );

        // Stream response
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

        // Include follow-up suggestions
        const domain = contextManager.inferDomain(data.content);
        const followUps = contextManager.generateFollowUps(domain);

        ws.send(
          JSON.stringify({
            type: "stream_end",
            sessionId,
            followUps,
          }),
        );
      } catch {
        // AI service not available, use fallback
        responseText = generateFallbackResponse(data.content);
        ws.send(
          JSON.stringify({
            type: "response",
            content: responseText,
            sessionId,
          }),
        );
      }

      // Save assistant response
      await db.insert(chatHistory).values({
        id: generateId(),
        role: "assistant",
        content: responseText,
        timestamp: new Date().toISOString(),
        sessionId,
      });
    } catch (e) {
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Failed to generate response",
          sessionId,
        }),
      );
    }
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
  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
    return `Hello! I'm ${APP_BRAND.assistantName}, your AI career assistant for the game industry. I can help with resumes, job searching, interview prep, and skill mapping. What would you like to work on?`;
  }
  return `I'm ${APP_BRAND.assistantName}, your game industry career assistant! Configure an AI provider in Settings to unlock my full capabilities. I can help with resumes, job matching, interview prep, and more.`;
}
