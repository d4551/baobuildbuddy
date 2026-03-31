import { Elysia } from "elysia";
export declare const authRoutes: Elysia<"/auth", {
    decorator: {};
    store: {};
    derive: {};
    resolve: {};
}, {
    typebox: {};
    error: {};
} & {
    error: {};
    typebox: import("@sinclair/typebox").TModule<{}, {}>;
}, {
    schema: {};
    standaloneSchema: {};
    macro: {};
    macroFn: {};
    parser: {};
    response: {};
} & {
    schema: {};
    macro: {};
    macroFn: {};
    parser: {};
}, {
    auth: {
        status: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        configured: boolean;
                        authRequired: boolean;
                        bootstrapRequired: boolean;
                        setupTokenConfigured: boolean;
                    };
                };
            };
        };
    };
} & {
    auth: {
        configured: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        configured: boolean;
                    };
                };
            };
        };
    };
} & {
    auth: {
        init: {
            post: {
                body: {} & {
                    setupToken?: string | undefined;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        configured: boolean;
                        message: string;
                        apiKey?: undefined;
                    } | {
                        configured: boolean;
                        apiKey: string;
                        message: string;
                    };
                    400: {
                        readonly error: "Setup token is required";
                    };
                    403: {
                        readonly error: "Setup token bootstrap is unavailable";
                    } | {
                        readonly error: "Setup token is invalid";
                    };
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
} & {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
    response: {};
} & {
    derive: {};
    resolve: {};
    schema: {};
}>;
