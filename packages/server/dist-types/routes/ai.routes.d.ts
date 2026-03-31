import { Elysia } from "elysia";
export declare const aiRoutes: Elysia<"/ai", {
    decorator: {};
    store: {};
    derive: {};
    resolve: {};
}, {
    typebox: {};
    error: {};
} & {
    error: {};
    typebox: import("@sinclair/typebox").TModule<{}, {}>;
}, {
    schema: {};
    standaloneSchema: {};
    macro: {};
    macroFn: {};
    parser: {};
    response: {};
} & {
    schema: {};
    macro: {};
    macroFn: {};
    parser: {};
}, {
    ai: {};
} & {
    ai: {
        chat: {
            post: {
                body: {
                    message: string;
                } & {
                    sessionId?: string | undefined;
                    context?: ({
                        source: string;
                        route: {
                            path: string;
                            params: Record<string, string>;
                            query: Record<string, string>;
                        } & {
                            name?: string | undefined;
                        };
                        state: {
                            hasResumes: boolean;
                            resumeCount: number;
                            hasJobs: boolean;
                            jobCount: number;
                            hasStudios: boolean;
                            studioCount: number;
                            hasInterviewSessions: boolean;
                            interviewSessionCount: number;
                            hasPortfolioProjects: boolean;
                            portfolioProjectCount: number;
                        } & {};
                    } & {
                        domain?: string | undefined;
                        entity?: ({
                            id: string;
                            type: string;
                        } & {
                            label?: string | undefined;
                        }) | undefined;
                    }) | undefined;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        message: string;
                        sessionId: string | null | undefined;
                        timestamp: string;
                        provider: "openai" | "huggingface" | "local" | "gemini" | "claude";
                        model: string;
                        followUps: string[];
                        contextDomain: "resume" | "job_search" | "interview" | "portfolio" | "skills" | "automation" | "general";
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
    ai: {
        "analyze-resume": {
            post: {
                body: {
                    resumeId: string;
                } & {
                    jobId?: string | undefined;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        error: string;
                        message?: undefined;
                        resumeId?: undefined;
                        jobId?: undefined;
                        analysis?: undefined;
                        provider?: undefined;
                        model?: undefined;
                    } | {
                        message: string;
                        resumeId: string;
                        jobId: string | null;
                        analysis: import("./ai-route-contracts").ResumeAnalysisResult;
                        provider: "openai" | "huggingface" | "local" | "gemini" | "claude";
                        model: string;
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
    ai: {
        "generate-cover-letter": {
            post: {
                body: {
                    resumeId: string;
                    company: string;
                    position: string;
                } & {
                    jobId?: string | undefined;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        error: string;
                        message?: undefined;
                        content?: undefined;
                        provider?: undefined;
                        model?: undefined;
                    } | {
                        message: string;
                        content: import("./ai-route-contracts").CoverLetterSections;
                        provider: "openai" | "huggingface" | "local" | "gemini" | "claude";
                        model: string;
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
    ai: {
        "match-jobs": {
            post: {
                body: {} & {
                    skills?: string[] | undefined;
                    resumeId?: string | undefined;
                    preferences?: Record<string, string | number | boolean> | undefined;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: import("./ai-route-contracts").MatchJobsResponse | {
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
    ai: {
        models: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: import("../services/ai/control-plane").AIControlPlaneState | {
                        providers: {
                            id: "openai" | "huggingface" | "local" | "gemini" | "claude";
                            nameKey: string;
                            descriptionKey: string;
                            iconId: "openai" | "huggingface" | "local" | "gemini" | "claude";
                            models: string[];
                            available: boolean;
                            health: "unconfigured";
                        }[];
                        error: string;
                    };
                };
            };
        };
    };
} & {
    ai: {
        usage: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        totalMessages: number;
                        userMessages: number;
                        assistantMessages: number;
                        sessions: number;
                        recentActivity: {
                            timestamp: string;
                            role: string;
                            sessionId: string | null;
                        }[];
                    };
                };
            };
        };
    };
} & {
    ai: {
        "automation-action": {
            post: {
                body: {
                    resumeId: string;
                    action: string;
                    jobUrl: string;
                } & {
                    jobId?: string | undefined;
                    coverLetterId?: string | undefined;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        error: string;
                        runId?: undefined;
                        status?: undefined;
                        message?: undefined;
                    } | {
                        runId: string;
                        status: string;
                        message: string;
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
}, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
    response: {};
} & {
    derive: {};
    resolve: {};
    schema: {};
}, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
    response: {};
} & {
    derive: {};
    resolve: {};
    schema: {};
}>;
