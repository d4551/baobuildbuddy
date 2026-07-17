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
                founded?: string | undefined;
                remoteWork?: boolean | undefined;
                technologies?: string[] | undefined;
                genres?: string[] | undefined;
                platforms?: string[] | undefined;
                culture?: Record<string, unknown> | undefined;
                benefits?: string[] | undefined;
                socialMedia?: Record<string, string> | undefined;
                notableGames?: string[] | undefined;
            };
            params: {};
            query: unknown;
            headers: unknown;
            response: {
                200: {
                    id: string;
                    name: string;
                    description: string | null;
                    website: string | null;
                    location: string | null;
                    type: string | null;
                    size: string | null;
                    founded: string | null;
                    remoteWork: boolean | undefined;
                    technologies: string[];
                    genres: string[];
                    platforms: string[];
                    culture: Record<string, unknown> | null;
                    benefits: string[];
                    socialMedia: Record<string, string> | null;
                    notableGames: string[];
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
                    founded?: string | undefined;
                    remoteWork?: boolean | undefined;
                    technologies?: string[] | undefined;
                    genres?: string[] | undefined;
                    platforms?: string[] | undefined;
                    culture?: Record<string, unknown> | undefined;
                    benefits?: string[] | undefined;
                    socialMedia?: Record<string, string> | undefined;
                    notableGames?: string[] | undefined;
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
} & {
    [x: string]: {
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
                        message?: undefined;
                        id?: undefined;
                        error: string;
                    } | {
                        error?: undefined;
                        message: string;
                        id: string;
                    };
                };
                error: never;
            };
        };
    };
}, import("elysia/types").DefaultEphemeral, import("elysia/types").DefaultEphemeral, "get", "/analytics", import("elysia/types").IntersectIfObjectSchema<import("elysia").UnwrapRoute<import("elysia").InputSchema<never>, {}, `${string}/analytics`>, import("elysia/types").MergeScopedSchemas<{}, {}, {}>>, {}, () => Promise<StudioAnalytics>>;
