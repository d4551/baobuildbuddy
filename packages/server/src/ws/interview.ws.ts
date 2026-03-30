import {
  resolveBrandSettings,
  SCHEMA_MAX_LENGTH_ID,
  SCHEMA_MAX_LENGTH_LABEL,
  SCHEMA_MAX_LENGTH_MESSAGE,
  toApiScopedPath,
  WS_ENDPOINTS,
} from "@bao/shared";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../db/client";
import { DEFAULT_SETTINGS_ID, settings } from "../db/schema/settings";
import {
  handleEndSession,
  handleStartSession,
  handleSubmitResponse,
} from "./interview-ws-support";

export const interviewWebSocket = new Elysia().ws(toApiScopedPath(WS_ENDPOINTS.interview), {
  body: t.Object({
    type: t.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL }),
    sessionId: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
    content: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_MESSAGE })),
    studioId: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
    config: t.Optional(t.Record(t.String(), t.Unknown())),
  }),
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
    switch (data.type) {
      case "start_session": {
        await handleStartSession(ws, data);
        break;
      }
      case "submit_response": {
        await handleSubmitResponse(ws, data);
        break;
      }
      case "end_session": {
        await handleEndSession(ws, data);
        break;
      }
      default: {
        ws.send(
          JSON.stringify({
            type: "error",
            message: `Unknown message type: ${data.type}`,
          }),
        );
      }
    }
  },
  close() {
    // Connection closed
  },
});
