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
                genre?: string | undefined;
                platform?: string | undefined;
                studioType?: string | undefined;
                location?: string | undefined;
                remote?: string | undefined;
                experienceLevel?: string | undefined;
                limit?: string | undefined;
                page?: string | undefined;
                q?: string | undefined;
            };
            headers: unknown;
            response: {
                200: {
                    jobs: {
                        id: string;
                        source: string | null;
                        type: string | null;
                        createdAt: string;
                        updatedAt: string;
                        company: string;
                        studioType: string | null;
                        title: string;
                        location: string;
                        remote: boolean | null;
                        hybrid: boolean | null;
                        salary: Record<string, unknown> | null;
                        description: string | null;
                        requirements: string[] | null;
                        technologies: string[] | null;
                        experienceLevel: string | null;
                        postedDate: string | null;
                        url: string | null;
                        gameGenres: string[] | null;
                        platforms: string[] | null;
                        contentHash: string | null;
                        tags: string[] | null;
                        companyLogo: string | null;
                        applicationUrl: string | null;
                        enrichment: import("@bao/shared/types/jobs").ScrapePersonaEnrichment | null;
                    }[];
                    page: number;
                    limit: number;
                    total: number;
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
                        id: string;
                        jobId: string;
                        savedAt: string;
                    } | {
                        error: string;
                        message?: undefined;
                        saved?: undefined;
                    } | {
                        message: string;
                        saved: {
                            id: string;
                            jobId: string;
                            savedAt: string;
                        };
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
                    } | {
                        error: string;
                        message?: undefined;
                        application?: undefined;
                    } | {
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
        apply: {
            ":id": {
                put: {
                    body: {} & {
                        status?: string | undefined;
                        notes?: string | undefined;
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
