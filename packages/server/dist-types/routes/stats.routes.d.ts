export declare const statsRoutes: import("elysia/types").AddRoute<string, "local", import("elysia/types").DefaultSingleton, {
    typebox: {};
    error: [];
}, import("elysia/types").DefaultMetadata, {
    [x: string]: {
        [x: string]: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        profile: {
                            completeness: number;
                        };
                        jobs: {
                            saved: number;
                            applied: number;
                            interviewing: number;
                            offered: number;
                        };
                        resumes: {
                            count: number;
                            lastUpdated: string | null;
                        };
                        coverLetters: {
                            count: number;
                        };
                        portfolio: {
                            projectCount: number;
                        };
                        interviews: {
                            totalSessions: number;
                            averageScore: number | null;
                        };
                        skills: {
                            mappedCount: number;
                        };
                        ai: {
                            chatMessages: number;
                            chatSessions: number;
                        };
                        gamification: {
                            level: number;
                            xp: number;
                            achievements: number;
                            streak: number;
                        };
                        automation: {
                            totalRuns: number;
                            successfulRuns: number;
                            successRate: number;
                            todayRuns: number;
                            recentRuns: {
                                id: string;
                                type: string;
                                status: string;
                                createdAt: string;
                            }[];
                        };
                    };
                };
                error: never;
            };
        };
    };
} & {
    [x: string]: {
        [x: string]: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        days: {
                            date: string;
                            actions: number;
                            xpEarned: number;
                        }[];
                        topCategory: string;
                        totalXP: number;
                    };
                };
                error: never;
            };
        };
    };
}, import("elysia/types").DefaultEphemeral, import("elysia/types").DefaultEphemeral, "get", string, import("elysia/types").IntersectIfObjectSchema<import("elysia").UnwrapRoute<{
    detail: {
        tags: string[];
        description: string;
    };
    response: {
        200: import("typebox").TObject<{
            skillCoverage: import("typebox").TNumber;
            applicationSuccessRate: import("typebox").TNumber;
            interviewTrend: import("typebox").TArray<import("typebox").TNumber>;
        }>;
    };
}, {}, `${string}/${string}`>, import("elysia/types").MergeScopedSchemas<{}, {}, {}>>, {}, ({ status }: {
    server: import("elysia").Server | null;
    redirect: import("elysia").redirect;
    set: {
        headers: import("elysia").HTTPHeaders;
        status?: number | keyof import("elysia").StatusMap;
        cookie?: Record<string, import("elysia").BaseCookie>;
    };
    status: import("elysia").SelectiveStatus<{
        200: {
            skillCoverage: number;
            applicationSuccessRate: number;
            interviewTrend: number[];
        };
    }>;
    readonly path: string;
    route?: string;
    rid?: string;
    request: Request;
    store: {};
    body: unknown;
    query: Record<string, string | undefined>;
    params: {};
    headers: Record<string, string | undefined>;
    cookie: Record<string, import("elysia").Cookie<unknown>>;
}) => Promise<import("elysia").ElysiaStatus<200, import("@bao/shared/types/search").CareerProgress, 200>>>;
