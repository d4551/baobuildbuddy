import { type RpaRunEvent } from "@bao/shared/schemas/rpa-events.schema";
import { Elysia } from "elysia";
/**
 * Broadcasts a validated automation event to subscribers of the matching run.
 */
export declare function broadcastAutomationEvent(event: RpaRunEvent): void;
/**
 * Automation websocket endpoint for run-scoped event subscriptions.
 */
export declare const automationWebSocket: Elysia<"", {
    decorator: {};
    store: {};
    derive: {};
    resolve: {};
}, {
    typebox: {};
    error: {};
}, {
    schema: {};
    standaloneSchema: {};
    macro: {};
    macroFn: {};
    parser: {};
    response: {};
}, {
    [x: string]: {
        subscribe: {
            body: {
                type: "subscribe" | "unsubscribe";
                runId?: string | undefined;
            };
            params: {};
            query: {};
            headers: {};
            response: {
                422: {
                    type: "validation";
                    on: string;
                    summary?: string;
                    message?: string;
                    found?: unknown;
                    property?: string;
                    expected?: string;
                };
            };
        };
    };
}, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
    response: {};
}, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
    response: {};
}>;
