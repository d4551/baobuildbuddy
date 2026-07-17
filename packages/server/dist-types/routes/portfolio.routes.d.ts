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
                200: {
                    id?: string | undefined;
                    metadata?: Record<string, unknown> | undefined;
                    projects: {
                        id?: string | undefined;
                        portfolioId?: string | undefined;
                        title: string;
                        description: string;
                        technologies?: string[] | null | undefined;
                        image?: string | null | undefined;
                        liveUrl?: string | null | undefined;
                        githubUrl?: string | null | undefined;
                        tags?: string[] | null | undefined;
                        featured?: boolean | null | undefined;
                        role?: string | null | undefined;
                        platforms?: string[] | null | undefined;
                        engines?: string[] | null | undefined;
                        sortOrder?: number | null | undefined;
                        createdAt?: string | undefined;
                        updatedAt?: string | undefined;
                    }[];
                    createdAt?: string | undefined;
                    updatedAt?: string | undefined;
                };
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
                200: {
                    id?: string | undefined;
                    metadata?: Record<string, unknown> | undefined;
                    projects: {
                        id?: string | undefined;
                        portfolioId?: string | undefined;
                        title: string;
                        description: string;
                        technologies?: string[] | null | undefined;
                        image?: string | null | undefined;
                        liveUrl?: string | null | undefined;
                        githubUrl?: string | null | undefined;
                        tags?: string[] | null | undefined;
                        featured?: boolean | null | undefined;
                        role?: string | null | undefined;
                        platforms?: string[] | null | undefined;
                        engines?: string[] | null | undefined;
                        sortOrder?: number | null | undefined;
                        createdAt?: string | undefined;
                        updatedAt?: string | undefined;
                    }[];
                    createdAt?: string | undefined;
                    updatedAt?: string | undefined;
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
                    200: {
                        id?: string | undefined;
                        portfolioId?: string | undefined;
                        title: string;
                        description: string;
                        technologies?: string[] | null | undefined;
                        image?: string | null | undefined;
                        liveUrl?: string | null | undefined;
                        githubUrl?: string | null | undefined;
                        tags?: string[] | null | undefined;
                        featured?: boolean | null | undefined;
                        role?: string | null | undefined;
                        platforms?: string[] | null | undefined;
                        engines?: string[] | null | undefined;
                        sortOrder?: number | null | undefined;
                        createdAt?: string | undefined;
                        updatedAt?: string | undefined;
                    };
                    201: {
                        id?: string | undefined;
                        portfolioId?: string | undefined;
                        title: string;
                        description: string;
                        technologies?: string[] | null | undefined;
                        image?: string | null | undefined;
                        liveUrl?: string | null | undefined;
                        githubUrl?: string | null | undefined;
                        tags?: string[] | null | undefined;
                        featured?: boolean | null | undefined;
                        role?: string | null | undefined;
                        platforms?: string[] | null | undefined;
                        engines?: string[] | null | undefined;
                        sortOrder?: number | null | undefined;
                        createdAt?: string | undefined;
                        updatedAt?: string | undefined;
                    };
                    404: {
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
                    500: {
                        error: string;
                        code?: string | undefined;
                        fields?: string[] | undefined;
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
                        200: {
                            id?: string | undefined;
                            metadata?: Record<string, unknown> | undefined;
                            projects: {
                                id?: string | undefined;
                                portfolioId?: string | undefined;
                                title: string;
                                description: string;
                                technologies?: string[] | null | undefined;
                                image?: string | null | undefined;
                                liveUrl?: string | null | undefined;
                                githubUrl?: string | null | undefined;
                                tags?: string[] | null | undefined;
                                featured?: boolean | null | undefined;
                                role?: string | null | undefined;
                                platforms?: string[] | null | undefined;
                                engines?: string[] | null | undefined;
                                sortOrder?: number | null | undefined;
                                createdAt?: string | undefined;
                                updatedAt?: string | undefined;
                            }[];
                            createdAt?: string | undefined;
                            updatedAt?: string | undefined;
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
                        500: {
                            error: string;
                            code?: string | undefined;
                            fields?: string[] | undefined;
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
                        200: {
                            id?: string | undefined;
                            portfolioId?: string | undefined;
                            title: string;
                            description: string;
                            technologies?: string[] | null | undefined;
                            image?: string | null | undefined;
                            liveUrl?: string | null | undefined;
                            githubUrl?: string | null | undefined;
                            tags?: string[] | null | undefined;
                            featured?: boolean | null | undefined;
                            role?: string | null | undefined;
                            platforms?: string[] | null | undefined;
                            engines?: string[] | null | undefined;
                            sortOrder?: number | null | undefined;
                            createdAt?: string | undefined;
                            updatedAt?: string | undefined;
                        };
                        201: {
                            id?: string | undefined;
                            portfolioId?: string | undefined;
                            title: string;
                            description: string;
                            technologies?: string[] | null | undefined;
                            image?: string | null | undefined;
                            liveUrl?: string | null | undefined;
                            githubUrl?: string | null | undefined;
                            tags?: string[] | null | undefined;
                            featured?: boolean | null | undefined;
                            role?: string | null | undefined;
                            platforms?: string[] | null | undefined;
                            engines?: string[] | null | undefined;
                            sortOrder?: number | null | undefined;
                            createdAt?: string | undefined;
                            updatedAt?: string | undefined;
                        };
                        404: {
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
                        500: {
                            error: string;
                            code?: string | undefined;
                            fields?: string[] | undefined;
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
                            success: boolean;
                            id: string;
                        };
                        404: {
                            error: string;
                            code?: string | undefined;
                            fields?: string[] | undefined;
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
    response: {
        200: import("typebox").TUnknown;
        404: import("typebox").TObject<{
            error: import("typebox").TString;
            code: import("typebox").TOptional<import("typebox").TString>;
            fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        }>;
        500: import("typebox").TObject<{
            error: import("typebox").TString;
            code: import("typebox").TOptional<import("typebox").TString>;
            fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        }>;
    };
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
