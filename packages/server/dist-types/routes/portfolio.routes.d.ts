import { type status } from "elysia";
import { type PortfolioExportRouteBody } from "./portfolio-route-contracts";
type RouteStatus = typeof status;
export declare const portfolioRoutes: import("elysia/types").AddRoute<string, "local", import("elysia/types").DefaultSingleton, {
    typebox: {};
    error: [];
}, import("elysia/types").DefaultMetadata, {
    [x: string]: {
        get: {
            body: unknown;
            params: {};
            query: unknown;
            headers: unknown;
            response: {
                200: unknown;
            };
            error: never;
        };
    };
} & {
    [x: string]: {
        put: {
            body: {
                metadata: Record<string, unknown>;
            };
            params: {};
            query: unknown;
            headers: unknown;
            response: {
                200: unknown;
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
    [x: string]: {
        projects: {
            post: {
                body: {
                    title: string;
                    description: string;
                    technologies?: string[] | undefined;
                    image?: string | undefined;
                    liveUrl?: string | undefined;
                    githubUrl?: string | undefined;
                    tags?: string[] | undefined;
                    featured?: boolean | undefined;
                    role?: string | undefined;
                    platforms?: string[] | undefined;
                    engines?: string[] | undefined;
                    sortOrder?: number | undefined;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: unknown;
                    201: unknown;
                    404: unknown;
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
                    500: unknown;
                };
                error: never;
            };
        };
    };
} & {
    [x: string]: {
        projects: {
            reorder: {
                post: {
                    body: {
                        orderedIds: string[];
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: unknown;
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
                        500: unknown;
                    };
                    error: never;
                };
            };
        };
    };
} & {
    [x: string]: {
        projects: {
            ":id": {
                put: {
                    body: {
                        title?: string | undefined;
                        description?: string | undefined;
                        technologies?: string[] | undefined;
                        image?: string | undefined;
                        liveUrl?: string | undefined;
                        githubUrl?: string | undefined;
                        tags?: string[] | undefined;
                        featured?: boolean | undefined;
                        role?: string | undefined;
                        platforms?: string[] | undefined;
                        engines?: string[] | undefined;
                        sortOrder?: number | undefined;
                    };
                    params: {
                        id: string;
                    };
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: unknown;
                        201: unknown;
                        404: unknown;
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
                        500: unknown;
                    };
                    error: never;
                };
            };
        };
    };
} & {
    [x: string]: {
        projects: {
            ":id": {
                delete: {
                    body: unknown;
                    params: {
                        id: string;
                    };
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: unknown;
                        404: unknown;
                    };
                    error: never;
                };
            };
        };
    };
}, import("elysia/types").DefaultEphemeral, import("elysia/types").DefaultEphemeral, "post", "/export", import("elysia/types").IntersectIfObjectSchema<import("elysia").UnwrapRoute<{
    detail: {
        tags: string[];
        description: string;
    };
    body: import("typebox").TObject<{
        format: import("typebox").TOptional<import("typebox").TString>;
    }>;
    response: {
        200: import("typebox").TUnknown;
        404: import("typebox").TUnknown;
        500: import("typebox").TUnknown;
    };
}, {}, `${string}/export`>, import("elysia/types").MergeScopedSchemas<{}, {}, {}>>, {}, ({ body, status }: {
    body: PortfolioExportRouteBody;
    status: RouteStatus;
}) => Promise<import("elysia").ElysiaStatus<200, Response, 200> | import("elysia").ElysiaStatus<404, {
    readonly error: "Portfolio not found";
}, 404> | import("elysia").ElysiaStatus<500, {
    readonly error: "Failed to export portfolio";
    readonly details: string;
}, 500>>>;
export {};
