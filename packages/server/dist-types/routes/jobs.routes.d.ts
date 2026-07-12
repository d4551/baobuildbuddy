import { Elysia } from "elysia";
export declare const jobsRoutes: Elysia<string, {
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
                experienceLevel?: string | undefined;
                genre?: string | undefined;
                limit?: string | undefined;
                location?: string | undefined;
                page?: string | undefined;
                platform?: string | undefined;
                q?: string | undefined;
                remote?: string | undefined;
                studioType?: string | undefined;
            };
            headers: unknown;
            response: {
                200: {
                    jobs: {
                        applicationUrl: string | null;
                        company: string;
                        companyLogo: string | null;
                        contentHash: string | null;
                        createdAt: string;
                        description: string | null;
                        enrichment: import("@bao/shared/types/jobs").ScrapePersonaEnrichment | null;
                        experienceLevel: string | null;
                        gameGenres: string[] | null;
                        hybrid: boolean | null;
                        id: string;
                        location: string;
                        platforms: string[] | null;
                        postedDate: string | null;
                        remote: boolean | null;
                        requirements: string[] | null;
                        salary: Record<string, unknown> | null;
                        source: string | null;
                        studioType: string | null;
                        tags: string[] | null;
                        technologies: string[] | null;
                        title: string;
                        type: string | null;
                        updatedAt: string;
                        url: string | null;
                    }[];
                    page: number;
                    limit: number;
                    total: number;
                };
                422: {
                    type: 'validation';
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
                        title: string;
                        company: string;
                        location: string;
                        remote: boolean | null;
                        hybrid: boolean | null;
                        salary: Record<string, unknown> | null;
                        description: string | null;
                        requirements: string[] | null;
                        technologies: string[] | null;
                        experienceLevel: string | null;
                        type: string | null;
                        postedDate: string | null;
                        url: string | null;
                        source: string | null;
                        studioType: string | null;
                        gameGenres: string[] | null;
                        platforms: string[] | null;
                        contentHash: string | null;
                        tags: string[] | null;
                        companyLogo: string | null;
                        applicationUrl: string | null;
                        enrichment: import("@bao/shared/types/jobs").ScrapePersonaEnrichment | null;
                        createdAt: string;
                        updatedAt: string;
                    } | {
                        error: string;
                    };
                    422: {
                        type: 'validation';
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
        save: {
            post: {
                body: {
                    jobId: string;
                } & {};
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        message?: undefined;
                        error: string;
                        saved?: undefined;
                    } | {
                        error?: undefined;
                        message: string;
                        saved: {
                            id: string;
                            jobId: string;
                            savedAt: string;
                        };
                    } | {
                        id: string;
                        jobId: string;
                        savedAt: string;
                    };
                    422: {
                        type: 'validation';
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
        save: {
            ":jobId": {
                delete: {
                    body: unknown;
                    params: {
                        jobId: string;
                    } & {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            success: boolean;
                            deleted: void;
                        };
                        422: {
                            type: 'validation';
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
                            remote: boolean | null;
                            hybrid: boolean | null;
                            salary: Record<string, unknown> | null;
                            description: string | null;
                            requirements: string[] | null;
                            technologies: string[] | null;
                            experienceLevel: string | null;
                            type: string | null;
                            postedDate: string | null;
                            url: string | null;
                            source: string | null;
                            studioType: string | null;
                            gameGenres: string[] | null;
                            platforms: string[] | null;
                            contentHash: string | null;
                            tags: string[] | null;
                            companyLogo: string | null;
                            applicationUrl: string | null;
                            enrichment: import("@bao/shared/types/jobs").ScrapePersonaEnrichment | null;
                            createdAt: string;
                            updatedAt: string;
                        } | null;
                    }[];
                };
            };
        };
    };
} & {
    [x: string]: {
        apply: {
            post: {
                body: {
                    jobId: string;
                } & {
                    notes?: string | undefined;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        message?: undefined;
                        error: string;
                        application?: undefined;
                    } | {
                        error?: undefined;
                        message: string;
                        application: {
                            id: string;
                            jobId: string;
                            status: string | null;
                            appliedDate: string;
                            notes: string | null;
                            timeline: unknown[] | null;
                            createdAt: string;
                            updatedAt: string;
                        };
                    } | {
                        id: string;
                        jobId: string;
                        status: string;
                        appliedDate: string;
                        notes: string;
                        timeline: {
                            status: string;
                            date: string;
                            notes: string;
                        }[];
                    };
                    422: {
                        type: 'validation';
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
        apply: {
            ":id": {
                put: {
                    body: {} & {
                        notes?: string | undefined;
                        status?: string | undefined;
                    };
                    params: {
                        id: string;
                    } & {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            id: string;
                            jobId: string;
                            status: string | null;
                            appliedDate: string;
                            notes: string | null;
                            timeline: unknown[] | null;
                            createdAt: string;
                            updatedAt: string;
                        } | {
                            error: string;
                        };
                        422: {
                            type: 'validation';
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
                        appliedDate: string;
                        notes: string | null;
                        timeline: unknown[] | null;
                        createdAt: string;
                        updatedAt: string;
                        job: {
                            id: string;
                            title: string;
                            company: string;
                            location: string;
                            remote: boolean | null;
                            hybrid: boolean | null;
                            salary: Record<string, unknown> | null;
                            description: string | null;
                            requirements: string[] | null;
                            technologies: string[] | null;
                            experienceLevel: string | null;
                            type: string | null;
                            postedDate: string | null;
                            url: string | null;
                            source: string | null;
                            studioType: string | null;
                            gameGenres: string[] | null;
                            platforms: string[] | null;
                            contentHash: string | null;
                            tags: string[] | null;
                            companyLogo: string | null;
                            applicationUrl: string | null;
                            enrichment: import("@bao/shared/types/jobs").ScrapePersonaEnrichment | null;
                            createdAt: string;
                            updatedAt: string;
                        } | null;
                    }[];
                };
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
                    200: import("./jobs-route-recommendations").JobRecommendationsResponse;
                };
            };
        };
    };
} & {
    [x: string]: {
        refresh: {
            post: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        message: string;
                        status: string;
                        totalJobs: number;
                        newJobs: number;
                        updatedJobs: number;
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
