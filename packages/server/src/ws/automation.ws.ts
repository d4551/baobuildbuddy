import { WS_ENDPOINTS, toApiScopedPath } from "@bao/shared/constants/endpoints";
import { SCHEMA_MAX_LENGTH_RUN_ID } from "@bao/shared/constants/schema-limits";
import { rpaRunEventSchema, type RpaRunEvent } from "@bao/shared/schemas/rpa-events.schema";
import Type, { StandardSchemaV1 } from "baobox";
import { Elysia } from "elysia";

const WS_READY_STATE_OPEN = 1;

type SubscriberSocket = {
  send: (message: string) => void;
  readyState?: number;
};

const subscribers = new Map<string, Set<SubscriberSocket>>();

const subscribeSocket = (runId: string, socket: SubscriberSocket): void => {
  const existing = subscribers.get(runId);
  if (existing) {
    existing.add(socket);
    return;
  }
  subscribers.set(runId, new Set([socket]));
};

const unsubscribeSocket = (runId: string, socket: SubscriberSocket): void => {
  const existing = subscribers.get(runId);
  if (!existing) {
    return;
  }

  existing.delete(socket);
  if (existing.size === 0) {
    subscribers.delete(runId);
  }
};

const unsubscribeSocketEverywhere = (socket: SubscriberSocket): void => {
  for (const [runId, set] of subscribers.entries()) {
    set.delete(socket);
    if (set.size === 0) {
      subscribers.delete(runId);
    }
  }
};

const isSocketOpen = (socket: SubscriberSocket): boolean =>
  typeof socket.readyState !== "number" || socket.readyState === WS_READY_STATE_OPEN;

/**
 * Broadcasts a validated automation event to subscribers of the matching run.
 */
export function broadcastAutomationEvent(event: RpaRunEvent): void {
  const validatedEvent = rpaRunEventSchema.safeParse(event);
  if (!validatedEvent.success) {
    return;
  }

  const runSubscribers = subscribers.get(validatedEvent.data.runId);
  if (!runSubscribers || runSubscribers.size === 0) {
    return;
  }

  const payload = JSON.stringify(validatedEvent.data);
  for (const socket of runSubscribers) {
    if (!isSocketOpen(socket)) {
      runSubscribers.delete(socket);
      continue;
    }
    socket.send(payload);
  }

  if (runSubscribers.size === 0) {
    subscribers.delete(validatedEvent.data.runId);
  }
}

/**
 * Automation websocket endpoint for run-scoped event subscriptions.
 */
export const automationWebSocket = new Elysia().ws(toApiScopedPath(WS_ENDPOINTS.automation), {
  body: StandardSchemaV1(
    Type.Object({
      type: Type.Union([Type.Literal("subscribe"), Type.Literal("unsubscribe")]),
      runId: Type.Optional(Type.String({ minLength: 8, maxLength: SCHEMA_MAX_LENGTH_RUN_ID })),
    }),
  ),

  message(ws, payload) {
    if (!payload.runId) {
      return;
    }

    if (payload.type === "subscribe") {
      subscribeSocket(payload.runId, ws);
      return;
    }

    unsubscribeSocket(payload.runId, ws);
  },

  close(ws) {
    unsubscribeSocketEverywhere(ws);
  },
});
