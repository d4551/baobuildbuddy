export declare const speechRoutes: import("elysia/types").AddRoute<string, "local", {
    decorator: {};
    store: {};
    derive: {};
}, {
    typebox: {};
    error: [];
}, import("elysia/types").DefaultMetadata, {
    [x: string]: {};
} & {
    [x: string]: {
        [x: string]: {
            post: {
                body: {
                    audioBase64: string;
                    mimeType: string;
                    filename?: string | undefined;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        text: string;
                        provider: string;
                        model: string;
                        message: string;
                    };
                    400: {
                        error: string;
                    };
                    422: {
                        error: string;
                    };
                    502: {
                        error: string;
                    };
                };
                error: never;
            };
        };
    };
}, import("elysia/types").DefaultEphemeral, {
    derive: {};
    schema: {};
    schemas: {};
    response: {};
    error: [];
}, "post", string, import("elysia/types").IntersectIfObjectSchema<import("elysia").UnwrapRoute<{
    detail: {
        tags: string[];
        description: string;
    };
    body: import("typebox").TObject<{
        text: import("typebox").TString;
        voice: import("typebox").TOptional<import("typebox").TString>;
    }>;
    response: {
        200: import("typebox").TObject<{
            audioBase64: import("typebox").TString;
            mimeType: import("typebox").TLiteral<"audio/wav">;
            provider: import("typebox").TString;
            model: import("typebox").TString;
            voice: import("typebox").TString;
            bytes: import("typebox").TNumber;
            message: import("typebox").TString;
        }>;
        400: import("typebox").TObject<{
            error: import("typebox").TString;
        }>;
        422: import("typebox").TObject<{
            error: import("typebox").TString;
        }>;
        502: import("typebox").TObject<{
            error: import("typebox").TString;
        }>;
    };
}, {}, `${string}/${string}`>, import("elysia/types").MergeScopedSchemas<{}, {}, {}>>, {}, ({ body, status }: {
    server: import("elysia").Server | null;
    redirect: import("elysia").redirect;
    set: {
        headers: import("elysia").HTTPHeaders;
        status?: number | keyof import("elysia").StatusMap;
        cookie?: Record<string, import("elysia").BaseCookie>;
    };
    status: import("elysia").SelectiveStatus<{
        200: {
            audioBase64: string;
            mimeType: "audio/wav";
            provider: string;
            model: string;
            voice: string;
            bytes: number;
            message: string;
        };
        400: {
            error: string;
        };
        422: {
            error: string;
        };
        502: {
            error: string;
        };
    }>;
    readonly path: string;
    route?: string;
    rid?: string;
    request: Request;
    store: {};
    body: {
        text: string;
        voice?: string | undefined;
    };
    query: Record<string, string | undefined>;
    params: {};
    headers: Record<string, string | undefined>;
    cookie: Record<string, import("elysia").Cookie<unknown>>;
}) => Promise<import("elysia").ElysiaStatus<200, {
    audioBase64: string;
    mimeType: "audio/wav";
    provider: "browser" | "custom" | "huggingface" | "local" | "openai";
    model: string;
    voice: string;
    bytes: number;
    message: string;
}, 200> | import("elysia").ElysiaStatus<400, {
    error: string;
}, 400> | import("elysia").ElysiaStatus<422, {
    error: string;
}, 422> | import("elysia").ElysiaStatus<502, {
    error: string;
}, 502>>>;
