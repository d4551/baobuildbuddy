import { Elysia } from "elysia";
export declare const studioRoutes: Elysia<"/studios", {
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
    studios: {
        get: {
            body: unknown;
            params: {};
            query: {
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
    studios: {
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
    studios: {
        post: {
            body: {
                website?: string | undefined;
                location?: string | undefined;
                type?: string | undefined;
                platforms?: string[] | undefined;
                genres?: string[] | undefined;
                description?: string | undefined;
                technologies?: string[] | undefined;
                size?: string | undefined;
                culture?: {} | undefined;
                remoteWork?: boolean | undefined;
                founded?: string | undefined;
                benefits?: string[] | undefined;
                socialMedia?: {} | undefined;
                notableGames?: string[] | undefined;
                name: string;
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
                    remoteWork: boolean;
                    technologies: string[];
                    genres: string[];
                    platforms: string[];
                    culture: {} | null;
                    benefits: string[];
                    socialMedia: {} | null;
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
    studios: {
        ":id": {
            put: {
                body: {
                    website?: string | undefined;
                    name?: string | undefined;
                    location?: string | undefined;
                    type?: string | undefined;
                    platforms?: string[] | undefined;
                    genres?: string[] | undefined;
                    description?: string | undefined;
                    technologies?: string[] | undefined;
                    size?: string | undefined;
                    culture?: {} | undefined;
                    remoteWork?: boolean | undefined;
                    founded?: string | undefined;
                    benefits?: string[] | undefined;
                    socialMedia?: {} | undefined;
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
    studios: {
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
    studios: {
        analytics: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        totalStudios: number;
                        byType: Record<string, number>;
                        bySize: Record<string, number>;
                        remoteWorkStudios: number;
                        topTechnologies: Array<{
                            name: string;
                            count: number;
                        }>;
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
