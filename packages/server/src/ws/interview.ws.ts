import {
  resolveBrandSettings,
  SCHEMA_MAX_LENGTH_ID,
  SCHEMA_MAX_LENGTH_LABEL,
  SCHEMA_MAX_LENGTH_MESSAGE,
  toApiScopedPath,
  WS_ENDPOINTS,
} from "@bao/shared";
import Type, { StandardSchemaV1 } from "baobox";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { db } from "../db/client";
import { DEFAULT_SETTINGS_ID, settings } from "../db/schema/settings";
import { sessionConfigSchema } from "../routes/interview-route-contracts";
import { handleEndSession, handleStartSession, handleSubmitResponse } from "./interview-ws-support";

export const interviewWebSocket = new Elysia().ws(toApiScopedPath(WS_ENDPOINTS.interview), {
  body: StandardSchemaV1(
    Type.Object({
      type: Type.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL }),
      sessionId: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
      content: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_MESSAGE })),
      studioId: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
      config: Type.Optional(sessionConfigSchema),
    }),
  ),
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
  async message(ws, data) {
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
  close() {
    // Connection closed
  },
});
