import type { RouteSetState } from "../types/route-state";
import { type PortfolioExportRouteBody } from "./portfolio-route-contracts";
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
                200: import("@bao/shared/types/portfolio").PortfolioData;
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
                200: import("@bao/shared/types/portfolio").PortfolioData;
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
                    200: import("@bao/shared/types/portfolio").PortfolioProject | {
                        error: string;
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
                        200: import("@bao/shared/types/portfolio").PortfolioData | {
                            error: string;
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
                        200: import("@bao/shared/types/portfolio").PortfolioProject | {
                            error: string;
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
                        200: {
                            success?: undefined;
                            id?: undefined;
                            error: string;
                        } | {
                            error?: undefined;
                            success: boolean;
                            id: string;
                        };
                    };
                    error: never;
                };
            };
        };
    };
}, import("elysia/types").DefaultEphemeral, import("elysia/types").DefaultEphemeral, "post", "/export", import("elysia/types").IntersectIfObjectSchema<import("elysia").UnwrapRoute<{
    detail: {
        tags: string[];
    };
    body: import("typebox").TObject<{
        format: import("typebox").TOptional<import("typebox").TString>;
    }>;
}, {}, `${string}/export`>, import("elysia/types").MergeScopedSchemas<{}, {}, {}>>, {}, ({ body, set }: {
    body: PortfolioExportRouteBody;
    set: RouteSetState;
}) => Promise<Response | {
    error: string;
    details?: undefined;
} | {
    error: string;
    details: string;
}>>;
