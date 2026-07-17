export declare const errorHandler: import("elysia/types").LocalHookReturn<"", "local", import("elysia/types").DefaultSingleton, {
    typebox: {};
    error: [];
}, import("elysia/types").DefaultMetadata, {}, import("elysia/types").DefaultEphemeral, import("elysia/types").DefaultEphemeral, {
    200: {
        error: string;
        code: string;
        fields: unknown[] | undefined;
    } | {
        fields?: undefined;
        error: string;
        code: string | undefined;
    };
}>;
