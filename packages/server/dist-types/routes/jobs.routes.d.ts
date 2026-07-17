export declare const jobsRoutes: import("elysia/types").AddRoute<string, "local", import("elysia/types").DefaultSingleton, {
    typebox: {};
    error: [];
}, import("elysia/types").DefaultMetadata, {
    [x: string]: {
        get: {
            body: unknown;
            params: {};
            query: {
                q?: string | undefined;
                location?: string | undefined;
                remote?: string | undefined;
                experienceLevel?: string | undefined;
                studioType?: string | undefined;
                platform?: string | undefined;
                genre?: string | undefined;
                page?: string | undefined;
                limit?: string | undefined;
            };
            headers: unknown;
            response: {
                200: {
                    jobs: {
                        id: string;
                        title: string;
                        company: string;
                        location: string;
                        remote?: boolean | null | undefined;
                        hybrid?: boolean | null | undefined;
                        salary?: unknown;
                        description?: string | null | undefined;
                        requirements?: string[] | null | undefined;
                        technologies?: string[] | null | undefined;
                        experienceLevel?: string | null | undefined;
                        type?: string | null | undefined;
                        postedDate?: string | null | undefined;
                        url?: string | null | undefined;
                        source?: string | null | undefined;
                        studioType?: string | null | undefined;
                        gameGenres?: string[] | null | undefined;
                        platforms?: string[] | null | undefined;
                        contentHash?: string | null | undefined;
                        tags?: string[] | null | undefined;
                        companyLogo?: string | null | undefined;
                        applicationUrl?: string | null | undefined;
                        enrichment?: unknown;
                        createdAt?: string | undefined;
                        updatedAt?: string | undefined;
                        matchScore?: number | undefined;
                        matchReason?: string | undefined;
                        rank?: number | undefined;
                    }[];
                    page: number;
                    limit: number;
                    total: number;
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
                        title: string;
                        company: string;
                        location: string;
                        remote?: boolean | null | undefined;
                        hybrid?: boolean | null | undefined;
                        salary?: unknown;
                        description?: string | null | undefined;
                        requirements?: string[] | null | undefined;
                        technologies?: string[] | null | undefined;
                        experienceLevel?: string | null | undefined;
                        type?: string | null | undefined;
                        postedDate?: string | null | undefined;
                        url?: string | null | undefined;
                        source?: string | null | undefined;
                        studioType?: string | null | undefined;
                        gameGenres?: string[] | null | undefined;
                        platforms?: string[] | null | undefined;
                        contentHash?: string | null | undefined;
                        tags?: string[] | null | undefined;
                        companyLogo?: string | null | undefined;
                        applicationUrl?: string | null | undefined;
                        enrichment?: unknown;
                        createdAt?: string | undefined;
                        updatedAt?: string | undefined;
                        matchScore?: number | undefined;
                        matchReason?: string | undefined;
                        rank?: number | undefined;
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
        save: {
            post: {
                body: {
                    jobId: string;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        message?: string | undefined;
                        saved?: {
                            id: string;
                            jobId: string;
                            savedAt: string;
                        } | undefined;
                        id?: string | undefined;
                        jobId?: string | undefined;
                        savedAt?: string | undefined;
                    };
                    201: {
                        id: string;
                        jobId: string;
                        savedAt: string;
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
} & {
    [x: string]: {
        save: {
            ":jobId": {
                delete: {
                    body: unknown;
                    params: {
                        jobId: string;
                    };
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            success: boolean;
                            deleted: unknown;
                        };
                    };
                    error: never;
                };
            };
        };
    };
} & {
    [x: string]: {
        saved: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        id: string;
                        jobId: string;
                        savedAt: string;
                        job: {
                            id: string;
                            title: string;
                            company: string;
                            location: string;
                            remote?: boolean | null | undefined;
                            hybrid?: boolean | null | undefined;
                            salary?: unknown;
                            description?: string | null | undefined;
                            requirements?: string[] | null | undefined;
                            technologies?: string[] | null | undefined;
                            experienceLevel?: string | null | undefined;
                            type?: string | null | undefined;
                            postedDate?: string | null | undefined;
                            url?: string | null | undefined;
                            source?: string | null | undefined;
                            studioType?: string | null | undefined;
                            gameGenres?: string[] | null | undefined;
                            platforms?: string[] | null | undefined;
                            contentHash?: string | null | undefined;
                            tags?: string[] | null | undefined;
                            companyLogo?: string | null | undefined;
                            applicationUrl?: string | null | undefined;
                            enrichment?: unknown;
                            createdAt?: string | undefined;
                            updatedAt?: string | undefined;
                            matchScore?: number | undefined;
                            matchReason?: string | undefined;
                            rank?: number | undefined;
                        } | null;
                    }[];
                };
                error: never;
            };
        };
    };
} & {
    [x: string]: {
        apply: {
            post: {
                body: {
                    jobId: string;
                    notes?: string | undefined;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        message?: string | undefined;
                        application?: {
                            id: string;
                            jobId: string;
                            status: string | null;
                            appliedDate?: string | null | undefined;
                            notes?: string | null | undefined;
                            timeline?: unknown[] | null | undefined;
                            createdAt?: string | undefined;
                            updatedAt?: string | undefined;
                        } | undefined;
                        id?: string | undefined;
                        jobId?: string | undefined;
                        status?: string | undefined;
                        appliedDate?: string | undefined;
                        notes?: string | undefined;
                        timeline?: unknown[] | undefined;
                    };
                    201: {
                        id: string;
                        jobId: string;
                        status: string | null;
                        appliedDate?: string | null | undefined;
                        notes?: string | null | undefined;
                        timeline?: unknown[] | null | undefined;
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
} & {
    [x: string]: {
        apply: {
            ":id": {
                put: {
                    body: {
                        status?: string | undefined;
                        notes?: string | undefined;
                    };
                    params: {
                        id: string;
                    };
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            id: string;
                            jobId: string;
                            status: string | null;
                            appliedDate?: string | null | undefined;
                            notes?: string | null | undefined;
                            timeline?: unknown[] | null | undefined;
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
    };
} & {
    [x: string]: {
        applications: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        id: string;
                        jobId: string;
                        status: string | null;
                        appliedDate?: string | null | undefined;
                        notes?: string | null | undefined;
                        timeline?: unknown[] | null | undefined;
                        createdAt?: string | undefined;
                        updatedAt?: string | undefined;
                    }[];
                };
                error: never;
            };
        };
    };
} & {
    [x: string]: {
        recommendations: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        recommendations: {
                            id: string;
                            title: string;
                            company: string;
                            location: string;
                            remote?: boolean | null | undefined;
                            hybrid?: boolean | null | undefined;
                            salary?: unknown;
                            description?: string | null | undefined;
                            requirements?: string[] | null | undefined;
                            technologies?: string[] | null | undefined;
                            experienceLevel?: string | null | undefined;
                            type?: string | null | undefined;
                            postedDate?: string | null | undefined;
                            url?: string | null | undefined;
                            source?: string | null | undefined;
                            studioType?: string | null | undefined;
                            gameGenres?: string[] | null | undefined;
                            platforms?: string[] | null | undefined;
                            contentHash?: string | null | undefined;
                            tags?: string[] | null | undefined;
                            companyLogo?: string | null | undefined;
                            applicationUrl?: string | null | undefined;
                            enrichment?: unknown;
                            createdAt?: string | undefined;
                            updatedAt?: string | undefined;
                            matchScore?: number | undefined;
                            matchReason?: string | undefined;
                            rank?: number | undefined;
                        }[];
                        reason: string;
                        aiPowered: boolean;
                        provider?: string | undefined;
                    };
                };
                error: never;
            };
        };
    };
}, import("elysia/types").DefaultEphemeral, import("elysia/types").DefaultEphemeral, "post", "/refresh", import("elysia/types").IntersectIfObjectSchema<import("elysia").UnwrapRoute<{
    detail: {
        tags: string[];
    };
    response: {
        readonly 200: import("typebox").TObject<{
            message: import("typebox").TString;
            status: import("typebox").TString;
            totalJobs: import("typebox").TNumber;
            newJobs: import("typebox").TNumber;
            updatedJobs: import("typebox").TNumber;
        }>;
        readonly 500: import("typebox").TObject<{
            error: import("typebox").TString;
            code: import("typebox").TOptional<import("typebox").TString>;
            details: import("typebox").TOptional<import("typebox").TString>;
            fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            id: import("typebox").TOptional<import("typebox").TString>;
        }>;
    };
}, {}, `${string}/refresh`>, import("elysia/types").MergeScopedSchemas<{}, {}, {}>>, {}, ({ status }: {
    body: unknown;
    query: Record<string, string | undefined>;
    params: {};
    headers: Record<string, string | undefined>;
    cookie: Record<string, import("elysia").Cookie<unknown>>;
    server: import("elysia").Server | null;
    redirect: import("elysia").redirect;
    set: {
        headers: import("elysia").HTTPHeaders;
        status?: number | keyof import("elysia").StatusMap;
        cookie?: Record<string, import("elysia").BaseCookie>;
    };
    readonly path: string;
    route?: string;
    rid?: string;
    request: Request;
    store: {};
    status: import("elysia").SelectiveStatus<{
        readonly 200: {
            message: string;
            status: string;
            totalJobs: number;
            newJobs: number;
            updatedJobs: number;
        };
        readonly 500: {
            error: string;
            code?: string | undefined;
            details?: string | undefined;
            fields?: string[] | undefined;
            id?: string | undefined;
        };
    }>;
}) => Promise<import("elysia").ElysiaStatus<200, {
    message: string;
    status: string;
    totalJobs: number;
    newJobs: number;
    updatedJobs: number;
}, 200> | import("elysia").ElysiaStatus<500, {
    error: string;
}, 500>>>;
