import { type RpaRunEvent } from "@bao/shared";
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
                runId?: string | undefined;
                type: "subscribe" | "unsubscribe";
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
