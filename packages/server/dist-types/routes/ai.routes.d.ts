import { Elysia } from "elysia";
/**
 * AI route group for chat, content generation, matching, and automation triggers.
 */
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
                    sessionId?: string | undefined;
                    context?: {
                        domain?: string | undefined;
                        entity?: {
                            label?: string | undefined;
                            type: string;
                            id: string;
                        } | undefined;
                        source: string;
                        route: {
                            name?: string | undefined;
                            query: {
                                [x: string]: string;
                            };
                            params: {
                                [x: string]: string;
                            };
                            path: string;
                        };
                        state: {
                            hasResumes: boolean;
                            hasJobs: boolean;
                            hasStudios: boolean;
                            hasInterviewSessions: boolean;
                            hasPortfolioProjects: boolean;
                        };
                    } | undefined;
                    message: string;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        message: string;
                        sessionId: string;
                        timestamp: string;
                        provider: "gemini" | "claude" | "openai" | "huggingface" | "local";
                        model: string;
                        followUps: string[];
                        contextDomain: "resume" | "job_search" | "interview" | "portfolio" | "skills" | "automation" | "general";
                        error?: undefined;
                    } | {
                        error: string;
                        message?: undefined;
                        sessionId?: undefined;
                        timestamp?: undefined;
                        provider?: undefined;
                        model?: undefined;
                        followUps?: undefined;
                        contextDomain?: undefined;
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
                    jobId?: string | undefined;
                    resumeId: string;
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
                        analysis: {
                            score: number;
                            strengths: string[];
                            improvements: string[];
                            keywords: never[];
                        };
                        provider: "gemini" | "claude" | "openai" | "huggingface" | "local";
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
                    jobId?: string | undefined;
                    resumeId: string;
                    company: string;
                    position: string;
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
                        content: {
                            introduction: string;
                            body: string;
                            conclusion: string;
                        };
                        provider: "gemini" | "claude" | "openai" | "huggingface" | "local";
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
                body: {
                    skills?: string[] | undefined;
                    resumeId?: string | undefined;
                    preferences?: {} | undefined;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        message: string;
                        matches: ({
                            jobId: string;
                            title: string;
                            company: string;
                            score: number;
                            strengths: never[];
                            concerns: never[];
                            highlightSkills: never[];
                            location?: undefined;
                            remote?: undefined;
                        } | {
                            jobId: string;
                            title: string;
                            company: string;
                            location: string;
                            remote: boolean | null;
                            score: number;
                            strengths: never[];
                            concerns: never[];
                            highlightSkills: never[];
                        })[];
                        recommendations: string[];
                        error?: undefined;
                    } | {
                        error: string;
                        message?: undefined;
                        matches?: undefined;
                        recommendations?: undefined;
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
                    200: {
                        providers: {
                            id: "gemini" | "claude" | "openai" | "huggingface" | "local";
                            name: string;
                            models: string[];
                            available: boolean;
                            health: "healthy" | "degraded" | "down" | "unconfigured";
                        }[];
                        preferredProvider: "gemini" | "claude" | "openai" | "huggingface" | "local";
                        configuredProviders: ("gemini" | "claude" | "openai" | "huggingface" | "local")[];
                        error?: undefined;
                    } | {
                        providers: {
                            id: "gemini" | "claude" | "openai" | "huggingface" | "local";
                            name: string;
                            models: string[];
                            available: boolean;
                            health: "unconfigured";
                        }[];
                        error: string;
                        preferredProvider?: undefined;
                        configuredProviders?: undefined;
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
                    jobId?: string | undefined;
                    coverLetterId?: string | undefined;
                    resumeId: string;
                    jobUrl: string;
                    action: string;
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
