import { Elysia } from "elysia";
export declare const authRoutes: Elysia<string, {
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
    [x: string]: {
        [x: string]: {
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
    [x: string]: {
        [x: string]: {
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
    [x: string]: {
        [x: string]: {
            post: {
                body: {} & {
                    setupToken?: string | undefined;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        error?: undefined;
                        configured: boolean;
                        message: string;
                        apiKey?: undefined;
                    } | {
                        message?: undefined;
                        error: string;
                        configured?: undefined;
                        apiKey?: undefined;
                    } | {
                        error?: undefined;
                        configured: boolean;
                        apiKey: string;
                        message: string;
                    };
                    422: {
                        type: 'validation';
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
