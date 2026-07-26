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
                    200: unknown;
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
                    429: {
                        error: string;
                        code?: string | undefined;
                        details?: string | undefined;
                        fields?: string[] | undefined;
                        id?: string | undefined;
                    };
                    500: {
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
                    429: {
                        error: string;
                        code?: string | undefined;
                        details?: string | undefined;
                        fields?: string[] | undefined;
                        id?: string | undefined;
                    };
                    500: {
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
                    200: unknown;
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
                    429: {
                        error: string;
                        code?: string | undefined;
                        details?: string | undefined;
                        fields?: string[] | undefined;
                        id?: string | undefined;
                    };
                    500: {
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
                    200: unknown;
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
                    429: {
                        error: string;
                        code?: string | undefined;
                        details?: string | undefined;
                        fields?: string[] | undefined;
                        id?: string | undefined;
                    };
                    500: {
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
        models: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        aiRouting?: {
                            chat: {
                                provider: "claude" | "gemini" | "huggingface" | "local" | "openai";
                                model?: string | undefined;
                            };
                            interviewQuestions: {
                                provider: "claude" | "gemini" | "huggingface" | "local" | "openai";
                                model?: string | undefined;
                            };
                            interviewFeedback: {
                                provider: "claude" | "gemini" | "huggingface" | "local" | "openai";
                                model?: string | undefined;
                            };
                            resume: {
                                provider: "claude" | "gemini" | "huggingface" | "local" | "openai";
                                model?: string | undefined;
                            };
                            coverLetter: {
                                provider: "claude" | "gemini" | "huggingface" | "local" | "openai";
                                model?: string | undefined;
                            };
                            emailResponse: {
                                provider: "claude" | "gemini" | "huggingface" | "local" | "openai";
                                model?: string | undefined;
                            };
                            jobMatch: {
                                provider: "claude" | "gemini" | "huggingface" | "local" | "openai";
                                model?: string | undefined;
                            };
                            scrapeEnrichment: {
                                provider: "claude" | "gemini" | "huggingface" | "local" | "openai";
                                model?: string | undefined;
                            };
                            automationFieldMapping: {
                                provider: "claude" | "gemini" | "huggingface" | "local" | "openai";
                                model?: string | undefined;
                            };
                        } | undefined;
                        configuredProviders?: ("claude" | "gemini" | "huggingface" | "local" | "openai")[] | undefined;
                        error?: string | undefined;
                        preferredModel?: string | null | undefined;
                        preferredProvider?: "claude" | "gemini" | "huggingface" | "local" | "openai" | undefined;
                        providerDiagnostics?: Record<string, {
                            provider: "claude" | "gemini" | "huggingface" | "local" | "openai";
                            code: string;
                            checkedAt: string;
                            endpoint?: string | undefined;
                            selectedModel?: string | undefined;
                            availableModels?: string[] | undefined;
                            message?: string | undefined;
                        }> | undefined;
                        providers: {
                            id: "claude" | "gemini" | "huggingface" | "local" | "openai";
                            nameKey: string;
                            descriptionKey: string;
                            iconId: "claude" | "gemini" | "huggingface" | "local" | "openai";
                            models: string[];
                            available: boolean;
                            health: "degraded" | "down" | "healthy" | "unconfigured";
                            selectedModel?: string | undefined;
                            diagnosticCode?: string | undefined;
                            availableModels?: string[] | undefined;
                            error?: string | undefined;
                        }[];
                    };
                    429: {
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
                    429: {
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
}, import("elysia/types").DefaultEphemeral, {
    derive: {};
    schema: {};
    schemas: {};
    response: {};
    error: [];
}, "post", "/automation-action", import("elysia/types").IntersectIfObjectSchema<import("elysia").UnwrapRoute<{
    detail: {
        tags: string[];
        description: string;
    };
    body: import("typebox").TObject<{
        action: import("typebox").TString;
        jobUrl: import("typebox").TString;
        resumeId: import("typebox").TString;
        coverLetterId: import("typebox").TOptional<import("typebox").TString>;
        jobId: import("typebox").TOptional<import("typebox").TString>;
    }>;
    response: {
        readonly 200: import("typebox").TObject<{
            runId: import("typebox").TString;
            status: import("typebox").TString;
            message: import("typebox").TString;
        }>;
        readonly 400: import("typebox").TObject<{
            error: import("typebox").TString;
            code: import("typebox").TOptional<import("typebox").TString>;
            details: import("typebox").TOptional<import("typebox").TString>;
            fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            id: import("typebox").TOptional<import("typebox").TString>;
        }>;
        readonly 404: import("typebox").TObject<{
            error: import("typebox").TString;
            code: import("typebox").TOptional<import("typebox").TString>;
            details: import("typebox").TOptional<import("typebox").TString>;
            fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            id: import("typebox").TOptional<import("typebox").TString>;
        }>;
        readonly 409: import("typebox").TObject<{
            error: import("typebox").TString;
            code: import("typebox").TOptional<import("typebox").TString>;
            details: import("typebox").TOptional<import("typebox").TString>;
            fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            id: import("typebox").TOptional<import("typebox").TString>;
        }>;
        readonly 422: import("typebox").TObject<{
            error: import("typebox").TString;
            code: import("typebox").TOptional<import("typebox").TString>;
            details: import("typebox").TOptional<import("typebox").TString>;
            fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            id: import("typebox").TOptional<import("typebox").TString>;
        }>;
        readonly 500: import("typebox").TObject<{
            error: import("typebox").TString;
            code: import("typebox").TOptional<import("typebox").TString>;
            details: import("typebox").TOptional<import("typebox").TString>;
            fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            id: import("typebox").TOptional<import("typebox").TString>;
        }>;
        readonly 429: import("typebox").TObject<{
            error: import("typebox").TString;
            code: import("typebox").TOptional<import("typebox").TString>;
            details: import("typebox").TOptional<import("typebox").TString>;
            fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            id: import("typebox").TOptional<import("typebox").TString>;
        }>;
    };
}, {}, `${string}/automation-action`>, import("elysia/types").MergeScopedSchemas<{}, {}, {}>>, {}, ({ body, status }: {
    server: import("elysia").Server | null;
    redirect: import("elysia").redirect;
    set: {
        headers: import("elysia").HTTPHeaders;
        status?: number | keyof import("elysia").StatusMap;
        cookie?: Record<string, import("elysia").BaseCookie>;
    };
    status: import("elysia").SelectiveStatus<{
        readonly 200: {
            runId: string;
            status: string;
            message: string;
        };
        readonly 400: {
            error: string;
            code?: string | undefined;
            details?: string | undefined;
            fields?: string[] | undefined;
            id?: string | undefined;
        };
        readonly 404: {
            error: string;
            code?: string | undefined;
            details?: string | undefined;
            fields?: string[] | undefined;
            id?: string | undefined;
        };
        readonly 409: {
            error: string;
            code?: string | undefined;
            details?: string | undefined;
            fields?: string[] | undefined;
            id?: string | undefined;
        };
        readonly 422: {
            error: string;
            code?: string | undefined;
            details?: string | undefined;
            fields?: string[] | undefined;
            id?: string | undefined;
        };
        readonly 500: {
            error: string;
            code?: string | undefined;
            details?: string | undefined;
            fields?: string[] | undefined;
            id?: string | undefined;
        };
        readonly 429: {
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
    body: {
        action: string;
        jobUrl: string;
        resumeId: string;
        coverLetterId?: string | undefined;
        jobId?: string | undefined;
    };
    query: Record<string, string | undefined>;
    params: {};
    headers: Record<string, string | undefined>;
    cookie: Record<string, import("elysia").Cookie<unknown>>;
}) => Promise<import("elysia").ElysiaStatus<200, {
    runId: string;
    status: string;
    message: string;
}, 200> | import("elysia").ElysiaStatus<400 | 404 | 409 | 422 | 500, {
    error: string;
} | {
    error: string;
}, 400 | 404 | 409 | 422 | 500>>>;
