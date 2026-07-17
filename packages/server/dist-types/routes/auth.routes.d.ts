import { Elysia } from "elysia";
export declare const authRoutes: Elysia<string, "local", {
    decorator: {};
    store: {};
    derive: {};
}, {
    typebox: {};
    error: [];
}, import("elysia/types").DefaultMetadata, {
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
                error: never;
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
                error: never;
            };
        };
    };
} & {
    [x: string]: {
        [x: string]: {
            post: {
                body: {
                    setupToken?: string | undefined;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        configured: boolean;
                        apiKey?: string | undefined;
                        message?: string | undefined;
                    };
                    400: {
                        error: string;
                        code?: string | undefined;
                        fields?: string[] | undefined;
                    };
                    403: {
                        error: string;
                        code?: string | undefined;
                        fields?: string[] | undefined;
                    };
                    422: {
                        type: 'validation';
                        title: 'Validation Error';
                        status: 422;
                        detail?: string;
                        on: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
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
}>;
