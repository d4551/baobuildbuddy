import { type RpaRunEvent } from "@bao/shared/schemas/rpa-events.schema";
/**
 * Broadcasts a validated automation event to subscribers of the matching run.
 */
export declare function broadcastAutomationEvent(event: RpaRunEvent): void;
/**
 * Automation websocket endpoint for run-scoped event subscriptions.
 */
export declare const automationWebSocket: import("elysia/types").AddWSRoute<"", "local", import("elysia/types").DefaultSingleton, {
    typebox: {};
    error: [];
}, import("elysia/types").DefaultMetadata, {}, import("elysia/types").DefaultEphemeral, import("elysia/types").DefaultEphemeral, string, import("elysia/types").IntersectIfObjectSchema<import("elysia").UnwrapRoute<{
    readonly body: import("typebox").TObject<{
        type: import("typebox").TUnion<[import("typebox").TLiteral<"subscribe">, import("typebox").TLiteral<"unsubscribe">]>;
        runId: import("typebox").TOptional<import("typebox").TString>;
    }>;
    readonly beforeHandle: unknown;
    readonly message: unknown;
    readonly close: unknown;
}, {}, `/${string}`>, import("elysia/types").MergeScopedSchemas<{}, {}, {}>>, {}, void>;
