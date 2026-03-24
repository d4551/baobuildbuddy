import { Elysia } from "elysia";
type MatchJobsResponse = {
    message: string;
    matches: Array<{
        jobId: string;
        title: string;
        company: string;
        location: string | null;
        remote: boolean;
        score: number;
        strengths: string[];
        concerns: string[];
        highlightSkills: string[];
    }>;
    recommendations: string[];
};
type CoverLetterSections = {
    introduction: string;
    body: string;
    conclusion: string;
};
type ResumeAnalysisResult = {
    score: number;
    strengths: string[];
    improvements: string[];
    keywords: string[];
};
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
                            id: string;
                            type: string;
                        } | undefined;
                        source: string;
                        route: {
                            name?: string | undefined;
                            path: string;
                            params: {
                                [x: string]: string;
                            };
                            query: {
                                [x: string]: string;
                            };
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
                        sessionId: string | null | undefined;
                        timestamp: string;
                        provider: "gemini" | "claude" | "openai" | "huggingface" | "local";
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
                        analysis: ResumeAnalysisResult;
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
                        content: CoverLetterSections;
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
                    200: MatchJobsResponse | {
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
                            id: "gemini" | "claude" | "openai" | "huggingface" | "local";
                            nameKey: string;
                            descriptionKey: string;
                            iconId: "gemini" | "claude" | "openai" | "huggingface" | "local";
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
                    coverLetterId?: string | undefined;
                    jobId?: string | undefined;
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
export {};
