export declare const log: import("@bogeychan/elysia-logger/types").ElysiaLogger<import("elysia").default<"", {
    decorator: {};
    store: {};
    derive: {
        readonly log: import("pino").Logger<never, boolean>;
    };
    resolve: {};
}, {
    typebox: import("@sinclair/typebox").TModule<{}>;
    error: {};
}, {
    schema: {};
    macro: {};
    macroFn: {};
    parser: {};
}, {}, {
    derive: {};
    resolve: {};
    schema: {};
}, {
    derive: {};
    resolve: {};
    schema: {};
}> | import("elysia").default<"", {
    decorator: {};
    store: import("@bogeychan/elysia-logger/types")._INTERNAL_Writeonly<import("@bogeychan/elysia-logger/types")._INTERNAL_ElysiaLoggerPluginAutoLoggingState>;
    derive: {
        readonly log: import("@bogeychan/elysia-logger/types").Logger;
    };
    resolve: {};
}, {
    typebox: import("@sinclair/typebox").TModule<{}>;
    error: {};
}, {
    schema: import("elysia").MergeSchema<import("elysia").MergeSchema<{}, {}, "">, {}, "">;
    macro: {};
    macroFn: {};
    parser: {};
}, {}, {
    derive: {};
    resolve: {};
    schema: {};
}, {
    derive: {};
    resolve: {};
    schema: {};
}>>;
export declare const logger: import("@bogeychan/elysia-logger/types")._INTERNAL_ElysiaLoggerPlugin<import("@bogeychan/elysia-logger/types")._INTERNAL_ElysiaLoggerPluginAutoLoggingState>;
