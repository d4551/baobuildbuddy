import { WS_ENDPOINTS } from "@bao/shared/constants/endpoints";
import { type RpaRunEvent, rpaRunEventSchema } from "@bao/shared/schemas/rpa-events.schema";
import { safeParseJson } from "@bao/shared/utils/json";
import type { ClientApiRequestRuntime } from "~/composables/api-request";
import { resolveWebSocketEndpoint } from "~/utils/endpoints";

/**
 * Subscribes to automation run events over WS_ENDPOINTS.automation.
 */
export function createAutomationRunSubscription(runtime: ClientApiRequestRuntime, wsBase: string) {
  return (runId: string, onEvent: (event: RpaRunEvent) => void): (() => void) => {
    const wsUrl = resolveWebSocketEndpoint(wsBase, runtime.requestUrl, WS_ENDPOINTS.automation);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "subscribe",
          runId,
        }),
      );
    };

    ws.onmessage = (event) => {
      if (typeof event.data !== "string") {
        return;
      }
      const parsedPayload = safeParseJson(event.data);
      const parsedEvent = rpaRunEventSchema.safeParse(parsedPayload);
      if (parsedEvent.success) {
        onEvent(parsedEvent.data);
      }
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: "unsubscribe",
            runId,
          }),
        );
      }
      ws.close();
    };
  };
}
