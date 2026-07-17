import { Elysia } from "elysia";
import { resolveBrandSettings } from "@bao/shared/constants/branding";
import { WS_ENDPOINTS, toApiScopedPath } from "@bao/shared/constants/endpoints";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { DEFAULT_SETTINGS_ID, settings } from "../db/schema/settings";
import { authenticateApiKey } from "../middleware/auth";
import { handleEndSession, handleStartSession, handleSubmitResponse } from "./interview-ws-support";
import {
  interviewWebSocketBodySchema,
  type InterviewWebSocketBody,
} from "./interview-ws-contracts";

export const interviewWebSocket = new Elysia().ws(toApiScopedPath(WS_ENDPOINTS.interview), {
  body: interviewWebSocketBodySchema,
  async beforeHandle({ request }) {
    const failure = await authenticateApiKey(request);
    if (failure) {
      return new Response(JSON.stringify({ error: failure.error }), {
        status: failure.status,
        headers: { "content-type": "application/json" },
      });
    }
  },
  async open(ws) {
    const settingsRows = await db
      .select()
      .from(settings)
      .where(eq(settings.id, DEFAULT_SETTINGS_ID));
    const runtimeBrand = resolveBrandSettings(settingsRows[0]?.brandSettings);
    ws.send(
      JSON.stringify({
        type: "connected",
        message: `Connected to ${runtimeBrand.assistantName} interview coaching`,
      }),
    );
  },
  async message(ws, data: InterviewWebSocketBody) {
    const messageType = data.type;
    if (!messageType) {
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Missing message type.",
        }),
      );
      return;
    }

    const normalizedData = {
      ...data,
      type: messageType,
    };

    switch (messageType) {
      case "start_session": {
        await handleStartSession(ws, normalizedData);
        break;
      }
      case "submit_response": {
        await handleSubmitResponse(ws, normalizedData);
        break;
      }
      case "end_session": {
        await handleEndSession(ws, normalizedData);
        break;
      }
      default: {
        ws.send(
          JSON.stringify({
            type: "error",
            message: `Unknown message type: ${messageType}`,
          }),
        );
      }
    }
  },
  close() {},
});
