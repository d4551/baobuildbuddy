export declare const chatWebSocket: import("elysia/types").AddWSRoute<"", "local", import("elysia/types").DefaultSingleton, {
    typebox: {};
    error: [];
}, import("elysia/types").DefaultMetadata, {}, import("elysia/types").DefaultEphemeral, import("elysia/types").DefaultEphemeral, string, import("elysia/types").IntersectIfObjectSchema<import("elysia").UnwrapRoute<{
    readonly body: import("typebox").TObject<{
        content: import("typebox").TString;
        sessionId: import("typebox").TOptional<import("typebox").TString>;
    }>;
    readonly beforeHandle: unknown;
    readonly open: unknown;
    readonly message: unknown;
    readonly close: () => void;
}, {}, `/${string}`>, import("elysia/types").MergeScopedSchemas<{}, {}, {}>>, {}, void>;
