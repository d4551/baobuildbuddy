import { Elysia } from "elysia";
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
export declare const studioRoutes: Elysia<string, {
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
    [x: string]: {
        get: {
            body: unknown;
            params: {};
            query: {} & {
                type?: string | undefined;
                size?: string | undefined;
                remoteWork?: string | undefined;
                q?: string | undefined;
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
} & {
    [x: string]: {
        ":id": {
            get: {
                body: unknown;
                params: {
                    id: string;
                } & {};
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
} & {
    [x: string]: {
        post: {
            body: {
                name: string;
            } & {
                type?: string | undefined;
                location?: string | undefined;
                description?: string | undefined;
                technologies?: string[] | undefined;
                platforms?: string[] | undefined;
                website?: string | undefined;
                size?: string | undefined;
                culture?: Record<string, unknown> | undefined;
                remoteWork?: boolean | undefined;
                genres?: string[] | undefined;
                founded?: string | undefined;
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
} & {
    [x: string]: {
        ":id": {
            put: {
                body: {} & {
                    name?: string | undefined;
                    type?: string | undefined;
                    location?: string | undefined;
                    description?: string | undefined;
                    technologies?: string[] | undefined;
                    platforms?: string[] | undefined;
                    website?: string | undefined;
                    size?: string | undefined;
                    culture?: Record<string, unknown> | undefined;
                    remoteWork?: boolean | undefined;
                    genres?: string[] | undefined;
                    founded?: string | undefined;
                    benefits?: string[] | undefined;
                    socialMedia?: Record<string, string> | undefined;
                    notableGames?: string[] | undefined;
                };
                params: {
                    id: string;
                } & {};
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
} & {
    [x: string]: {
        ":id": {
            delete: {
                body: unknown;
                params: {
                    id: string;
                } & {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        error: string;
                        message?: undefined;
                        id?: undefined;
                    } | {
                        message: string;
                        id: string;
                        error?: undefined;
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
