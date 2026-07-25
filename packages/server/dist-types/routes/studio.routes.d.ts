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
                    games?: string[] | null | undefined;
                    technologies?: string[] | null | undefined;
                    culture?: unknown;
                    interviewStyle?: string | null | undefined;
                    remoteWork?: boolean | null | undefined;
                    enrichment?: unknown;
                    createdAt?: string | undefined;
                    updatedAt?: string | undefined;
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
                    200: {
                        totalStudios: number;
                        byType: Record<string, number>;
                        bySize: Record<string, number>;
                        remoteWorkStudios: number;
                        topTechnologies: {
                            name: string;
                            count: number;
                        }[];
                    };
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
                        games?: string[] | null | undefined;
                        technologies?: string[] | null | undefined;
                        culture?: unknown;
                        interviewStyle?: string | null | undefined;
                        remoteWork?: boolean | null | undefined;
                        enrichment?: unknown;
                        createdAt?: string | undefined;
                        updatedAt?: string | undefined;
                    };
                    201: {
                        id: string;
                        name: string;
                        logo: string | null;
                        website: string | null;
                        location: string | null;
                        size: string | null;
                        type: string | null;
                        description: string | null;
                        games?: string[] | null | undefined;
                        technologies?: string[] | null | undefined;
                        culture?: unknown;
                        interviewStyle?: string | null | undefined;
                        remoteWork?: boolean | null | undefined;
                        enrichment?: unknown;
                        createdAt?: string | undefined;
                        updatedAt?: string | undefined;
                    };
                    404: {
                        error: string;
                        code?: string | undefined;
                        details?: string | undefined;
                        fields?: string[] | undefined;
                        id?: string | undefined;
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
                    id: string;
                    name: string;
                    logo: string | null;
                    website: string | null;
                    location: string | null;
                    size: string | null;
                    type: string | null;
                    description: string | null;
                    games?: string[] | null | undefined;
                    technologies?: string[] | null | undefined;
                    culture?: unknown;
                    interviewStyle?: string | null | undefined;
                    remoteWork?: boolean | null | undefined;
                    enrichment?: unknown;
                    createdAt?: string | undefined;
                    updatedAt?: string | undefined;
                };
                201: {
                    id: string;
                    name: string;
                    logo: string | null;
                    website: string | null;
                    location: string | null;
                    size: string | null;
                    type: string | null;
                    description: string | null;
                    games?: string[] | null | undefined;
                    technologies?: string[] | null | undefined;
                    culture?: unknown;
                    interviewStyle?: string | null | undefined;
                    remoteWork?: boolean | null | undefined;
                    enrichment?: unknown;
                    createdAt?: string | undefined;
                    updatedAt?: string | undefined;
                };
                404: {
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
                        games?: string[] | null | undefined;
                        technologies?: string[] | null | undefined;
                        culture?: unknown;
                        interviewStyle?: string | null | undefined;
                        remoteWork?: boolean | null | undefined;
                        enrichment?: unknown;
                        createdAt?: string | undefined;
                        updatedAt?: string | undefined;
                    };
                    201: {
                        id: string;
                        name: string;
                        logo: string | null;
                        website: string | null;
                        location: string | null;
                        size: string | null;
                        type: string | null;
                        description: string | null;
                        games?: string[] | null | undefined;
                        technologies?: string[] | null | undefined;
                        culture?: unknown;
                        interviewStyle?: string | null | undefined;
                        remoteWork?: boolean | null | undefined;
                        enrichment?: unknown;
                        createdAt?: string | undefined;
                        updatedAt?: string | undefined;
                    };
                    404: {
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
    };
}, import("elysia/types").DefaultEphemeral, import("elysia/types").DefaultEphemeral, "delete", "/:id", import("elysia/types").IntersectIfObjectSchema<import("elysia").UnwrapRoute<{
    detail: {
        tags: string[];
        description: string;
    };
    params: import("typebox").TObject<{
        id: import("typebox").TString;
    }>;
    response: {
        readonly 200: import("typebox").TObject<{
            message: import("typebox").TString;
            id: import("typebox").TString;
        }>;
        readonly 404: import("typebox").TObject<{
            error: import("typebox").TString;
            code: import("typebox").TOptional<import("typebox").TString>;
            details: import("typebox").TOptional<import("typebox").TString>;
            fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            id: import("typebox").TOptional<import("typebox").TString>;
        }>;
    };
}, {}, `${string}/:id`>, import("elysia/types").MergeScopedSchemas<{}, {}, {}>>, {}, ({ params, status }: {
    server: import("elysia").Server | null;
    redirect: import("elysia").redirect;
    set: {
        headers: import("elysia").HTTPHeaders;
        status?: number | keyof import("elysia").StatusMap;
        cookie?: Record<string, import("elysia").BaseCookie>;
    };
    status: import("elysia").SelectiveStatus<{
        readonly 200: {
            message: string;
            id: string;
        };
        readonly 404: {
            error: string;
            code?: string | undefined;
            details?: string | undefined;
            fields?: string[] | undefined;
            id?: string | undefined;
        };
    }>;
    readonly path: string;
    route?: string;
    rid?: string;
    request: Request;
    store: {};
    body: unknown;
    query: Record<string, string | undefined>;
    params: {
        id: string;
    };
    headers: Record<string, string | undefined>;
    cookie: Record<string, import("elysia").Cookie<unknown>>;
}) => Promise<import("elysia").ElysiaStatus<200, {
    message: string;
    id: string;
}, 200> | import("elysia").ElysiaStatus<404, {
    error: string;
}, 404>>>;
