import type { RouteSetState } from "../types/route-state";
import { type AutomationActionRouteBody } from "./ai-route-contracts";
export declare const aiRoutes: import("elysia/types").AddRoute<string, "local", {
    decorator: {};
    store: {};
    derive: {};
}, {
    typebox: {};
    error: [];
}, import("elysia/types").DefaultMetadata, {
    [x: string]: {};
} & {
    [x: string]: {
        chat: {
            post: {
                body: {
                    message: string;
                    sessionId?: string | undefined;
                    context?: {
                        source: string;
                        domain?: string | undefined;
                        route: {
                            path: string;
                            name?: string | undefined;
                            params: Record<string, string>;
                            query: Record<string, string>;
                        };
                        entity?: {
                            type: string;
                            id: string;
                            label?: string | undefined;
                        } | undefined;
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
        "analyze-resume": {
            post: {
                body: {
                    resumeId: string;
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
                        error?: undefined;
                        message: string;
                        resumeId: string;
                        jobId: string | null;
                        analysis: {
                            score: number;
                            strengths: string[];
                            improvements: string[];
                            keywords: string[];
                        };
                        provider: "claude" | "gemini" | "huggingface" | "local" | "openai";
                        model: string;
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
        "generate-cover-letter": {
            post: {
                body: {
                    resumeId: string;
                    jobId?: string | undefined;
                    company: string;
                    position: string;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        message?: undefined;
                        provider?: undefined;
                        model?: undefined;
                        error: string;
                        content?: undefined;
                    } | {
                        error?: undefined;
                        message: string;
                        content: {
                            introduction: string;
                            body: string;
                            conclusion: string;
                        };
                        provider: "claude" | "gemini" | "huggingface" | "local" | "openai";
                        model: string;
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
        "match-jobs": {
            post: {
                body: {
                    resumeId?: string | undefined;
                    skills?: string[] | undefined;
                    preferences?: Record<string, string | number | boolean> | undefined;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        message: string;
                        matches: {
                            jobId: string;
                            title: string;
                            company: string;
                            location: string | null;
                            remote: boolean;
                            score: number;
                            strengths: string[];
                            concerns: string[];
                            highlightSkills: string[];
                        }[];
                        recommendations: string[];
                    } | {
                        error: string;
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
                error: never;
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
                error: never;
            };
        };
    };
}, import("elysia/types").DefaultEphemeral, {
    derive: {};
    schema: {};
    schemas: {};
    response: {};
    error: [];
}, "post", "/automation-action", import("elysia/types").IntersectIfObjectSchema<import("elysia").UnwrapRoute<{
    detail: {
        tags: string[];
    };
    body: import("typebox").TObject<{
        action: import("typebox").TString;
        jobUrl: import("typebox").TString;
        resumeId: import("typebox").TString;
        coverLetterId: import("typebox").TOptional<import("typebox").TString>;
        jobId: import("typebox").TOptional<import("typebox").TString>;
    }>;
}, {}, `${string}/automation-action`>, import("elysia/types").MergeScopedSchemas<{}, {}, {}>>, {}, ({ body, set }: {
    body: AutomationActionRouteBody;
    set: RouteSetState;
}) => Promise<{
    message?: undefined;
    error: string;
    runId?: undefined;
    status?: undefined;
} | {
    error?: undefined;
    runId: string;
    status: string;
    message: string;
}>>;
