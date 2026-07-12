import { Elysia } from "elysia";
export declare const aiRoutes: Elysia<string, {
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
    [x: string]: {};
} & {
    [x: string]: {
        chat: {
            post: {
                body: {
                    message: string;
                } & {
                    context?: ({
                        route: {
                            params: Record<string, string>;
                            path: string;
                            query: Record<string, string>;
                        } & {
                            name?: string | undefined;
                        };
                        source: string;
                        state: {
                            hasInterviewSessions: boolean;
                            hasJobs: boolean;
                            hasPortfolioProjects: boolean;
                            hasResumes: boolean;
                            hasStudios: boolean;
                            interviewSessionCount: number;
                            jobCount: number;
                            portfolioProjectCount: number;
                            resumeCount: number;
                            studioCount: number;
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
                    sessionId?: string | undefined;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        message: string;
                        sessionId: string | null | undefined;
                        timestamp: string;
                        provider: "claude" | "gemini" | "huggingface" | "local" | "openai";
                        model: string;
                        followUps: string[];
                        contextDomain: "automation" | "general" | "interview" | "job_search" | "portfolio" | "resume" | "skills";
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
                        model?: undefined;
                        error: string;
                        message?: undefined;
                        resumeId?: undefined;
                        jobId?: undefined;
                        analysis?: undefined;
                        provider?: undefined;
                    } | {
                        error?: undefined;
                        message: string;
                        resumeId: string;
                        jobId: string | null;
                        analysis: import("./ai-route-contracts").ResumeAnalysisResult;
                        provider: "claude" | "gemini" | "huggingface" | "local" | "openai";
                        model: string;
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
        "generate-cover-letter": {
            post: {
                body: {
                    company: string;
                    position: string;
                    resumeId: string;
                } & {
                    jobId?: string | undefined;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        model?: undefined;
                        message?: undefined;
                        provider?: undefined;
                        error: string;
                        content?: undefined;
                    } | {
                        error?: undefined;
                        message: string;
                        content: import("./ai-route-contracts").CoverLetterSections;
                        provider: "claude" | "gemini" | "huggingface" | "local" | "openai";
                        model: string;
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
        "match-jobs": {
            post: {
                body: {} & {
                    preferences?: Record<string, string | number | boolean> | undefined;
                    resumeId?: string | undefined;
                    skills?: string[] | undefined;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: import("./ai-route-contracts").MatchJobsResponse | {
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
        models: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: import("../services/ai/control-plane").AIControlPlaneState | {
                        providers: {
                            id: "claude" | "gemini" | "huggingface" | "local" | "openai";
                            nameKey: string;
                            descriptionKey: string;
                            iconId: "claude" | "gemini" | "huggingface" | "local" | "openai";
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
    [x: string]: {
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
    [x: string]: {
        "automation-action": {
            post: {
                body: {
                    action: string;
                    jobUrl: string;
                    resumeId: string;
                } & {
                    coverLetterId?: string | undefined;
                    jobId?: string | undefined;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        message?: undefined;
                        error: string;
                        runId?: undefined;
                        status?: undefined;
                    } | {
                        error?: undefined;
                        runId: string;
                        status: string;
                        message: string;
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
