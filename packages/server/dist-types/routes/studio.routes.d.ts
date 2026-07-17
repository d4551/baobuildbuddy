import type { RouteSetState } from "../types/route-state";
import { type StudioIdParams } from "./studio-route-contracts";
export interface StudioAnalytics {
    totalStudios: number;
    byType: Record<string, number>;
    bySize: Record<string, number>;
    remoteWorkStudios: number;
    topTechnologies: Array<{
        name: string;
        count: number;
    }>;
}
export declare const studioRoutes: import("elysia/types").AddRoute<string, "local", import("elysia/types").DefaultSingleton, {
    typebox: {};
    error: [];
}, import("elysia/types").DefaultMetadata, {
    [x: string]: {
        get: {
            body: unknown;
            params: {};
            query: {
                q?: string | undefined;
                type?: string | undefined;
                size?: string | undefined;
                remoteWork?: string | undefined;
            };
            headers: unknown;
            response: {
                200: {
                    id: string;
                    name: string;
                    logo: string | null;
                    website: string | null;
                    location: string | null;
                    size: string | null;
                    type: string | null;
                    description: string | null;
                    games: string[] | null;
                    technologies: string[] | null;
                    culture: Record<string, unknown> | null;
                    interviewStyle: string | null;
                    remoteWork: boolean | null;
                    enrichment: import("@bao/shared/types/jobs").ScrapePersonaEnrichment | null;
                    createdAt: string;
                    updatedAt: string;
                }[];
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
        analytics: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: StudioAnalytics;
                };
                error: never;
            };
        };
    };
} & {
    [x: string]: {
        ":id": {
            get: {
                body: unknown;
                params: {
                    id: string;
                };
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        id: string;
                        name: string;
                        logo: string | null;
                        website: string | null;
                        location: string | null;
                        size: string | null;
                        type: string | null;
                        description: string | null;
                        games: string[] | null;
                        technologies: string[] | null;
                        culture: Record<string, unknown> | null;
                        interviewStyle: string | null;
                        remoteWork: boolean | null;
                        enrichment: import("@bao/shared/types/jobs").ScrapePersonaEnrichment | null;
                        createdAt: string;
                        updatedAt: string;
                    } | {
                        error: string;
                    };
                };
                error: never;
            };
        };
    };
} & {
    [x: string]: {
        post: {
            body: {
                name: string;
                description?: string | undefined;
                website?: string | undefined;
                location?: string | undefined;
                type?: string | undefined;
                size?: string | undefined;
                remoteWork?: boolean | undefined;
                technologies?: string[] | undefined;
                games?: string[] | undefined;
                culture?: Record<string, unknown> | undefined;
                interviewStyle?: string | undefined;
                logo?: string | undefined;
            };
            params: {};
            query: unknown;
            headers: unknown;
            response: {
                200: {
                    createdAt?: string | undefined;
                    culture?: Record<string, unknown> | null | undefined;
                    description?: string | null | undefined;
                    enrichment?: import("@bao/shared/types/jobs").ScrapePersonaEnrichment | null | undefined;
                    games?: string[] | null | undefined;
                    id: string;
                    interviewStyle?: string | null | undefined;
                    location?: string | null | undefined;
                    logo?: string | null | undefined;
                    name: string;
                    remoteWork?: boolean | null | undefined;
                    size?: string | null | undefined;
                    technologies?: string[] | null | undefined;
                    type?: string | null | undefined;
                    updatedAt?: string | undefined;
                    website?: string | null | undefined;
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
        ":id": {
            put: {
                body: {
                    name?: string | undefined;
                    description?: string | undefined;
                    website?: string | undefined;
                    location?: string | undefined;
                    type?: string | undefined;
                    size?: string | undefined;
                    remoteWork?: boolean | undefined;
                    technologies?: string[] | undefined;
                    games?: string[] | undefined;
                    culture?: Record<string, unknown> | undefined;
                    interviewStyle?: string | undefined;
                    logo?: string | undefined;
                };
                params: {
                    id: string;
                };
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        id: string;
                        name: string;
                        logo: string | null;
                        website: string | null;
                        location: string | null;
                        size: string | null;
                        type: string | null;
                        description: string | null;
                        games: string[] | null;
                        technologies: string[] | null;
                        culture: Record<string, unknown> | null;
                        interviewStyle: string | null;
                        remoteWork: boolean | null;
                        enrichment: import("@bao/shared/types/jobs").ScrapePersonaEnrichment | null;
                        createdAt: string;
                        updatedAt: string;
                    } | {
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
}, import("elysia/types").DefaultEphemeral, import("elysia/types").DefaultEphemeral, "delete", "/:id", import("elysia/types").IntersectIfObjectSchema<import("elysia").UnwrapRoute<{
    detail: {
        tags: string[];
    };
    params: import("typebox").TObject<{
        id: import("typebox").TString;
    }>;
}, {}, `${string}/:id`>, import("elysia/types").MergeScopedSchemas<{}, {}, {}>>, {}, ({ params, set }: {
    params: StudioIdParams;
    set: RouteSetState;
}) => Promise<{
    message?: undefined;
    error: string;
    id?: undefined;
} | {
    error?: undefined;
    message: string;
    id: string;
}>>;
