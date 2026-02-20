import { Elysia, t } from "elysia";

/**
 * In-memory subscriber registry: runId → Set of connected WebSockets.
 */
const subscribers = new Map<string, Set<unknown>>();

/**
 * Broadcast a progress/completion event to all WebSocket clients subscribed to a run.
 */
export function broadcastProgress(runId: string, data: Record<string, unknown>): void {
  const subs = subscribers.get(runId);
  if (!subs || subs.size === 0) return;

  const msg = JSON.stringify({ ...data, runId });
  for (const ws of subs) {
    try {
      (ws as { send: (msg: string) => void }).send(msg);
    } catch {
      subs.delete(ws);
    }
  }
}

/**
 * Clean up empty subscriber sets to prevent memory leaks.
 */
function cleanup(runId: string): void {
  const subs = subscribers.get(runId);
  if (subs && subs.size === 0) {
    subscribers.delete(runId);
  }
}

export const automationWebSocket = new Elysia().ws("/ws/automation", {
  body: t.Object({
    type: t.String({ maxLength: 50 }),
    runId: t.Optional(t.String({ maxLength: 100 })),
  }),

  open(ws) {
    ws.send(JSON.stringify({ type: "connected" }));
  },

  message(ws, { type, runId }) {
    if (type === "subscribe" && runId) {
      if (!subscribers.has(runId)) {
        subscribers.set(runId, new Set());
      }
      subscribers.get(runId)?.add(ws);
      ws.send(JSON.stringify({ type: "subscribed", runId }));
    }

    if (type === "unsubscribe" && runId) {
      subscribers.get(runId)?.delete(ws);
      cleanup(runId);
    }
  },

  close(ws) {
    // Remove this WebSocket from all subscriber sets
    for (const [runId, subs] of subscribers) {
      subs.delete(ws);
      if (subs.size === 0) {
        subscribers.delete(runId);
      }
    }
  },
});
