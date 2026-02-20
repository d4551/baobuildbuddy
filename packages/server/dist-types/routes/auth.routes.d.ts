import { Elysia } from "elysia";
export declare const authRoutes: Elysia<"/auth", {
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
                    } | {
                        authRequired: boolean;
                        configured?: undefined;
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
                body: unknown;
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
