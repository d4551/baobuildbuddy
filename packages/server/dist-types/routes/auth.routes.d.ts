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
                        details?: string | undefined;
                        fields?: string[] | undefined;
                        id?: string | undefined;
                    };
                    403: {
                        error: string;
                        code?: string | undefined;
                        details?: string | undefined;
                        fields?: string[] | undefined;
                        id?: string | undefined;
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
    } & {
        rotate: {
            post: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        readonly configured: true;
                        readonly apiKey: string;
                        readonly message: "API key rotated. Save this new key — it will not be shown again.";
                    } & {
                        readonly configured: true;
                        readonly apiKey: string;
                        readonly message: "API key rotated. Save this new key — it will not be shown again.";
                    };
                    403: {
                        readonly error: "Missing or invalid Authorization header";
                    };
                    404: {
                        readonly error: "No API key configured to rotate";
                    };
                };
                error: never;
            };
        };
    } & {
        revoke: {
            post: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        readonly revoked: true;
                        readonly message: "API key has been revoked.";
                    } & {
                        readonly revoked: true;
                        readonly message: "API key has been revoked.";
                    };
                    403: {
                        readonly error: "Missing or invalid Authorization header";
                    };
                    404: {
                        readonly error: "No API key configured to revoke";
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
