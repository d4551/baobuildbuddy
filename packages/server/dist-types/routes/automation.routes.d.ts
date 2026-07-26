/**
 * Automation API routes for RPA-driven workflows and run history.
 */
export declare const automationRoutes: import("elysia/types").AddRoute<string, "local", {
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
        verify: {
            context: {
                get: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            resumeId: string;
                        };
                        204: void;
                        404: {
                            error: {
                                code: string;
                                message: string;
                                details?: Record<string, unknown> | undefined;
                            };
                        };
                        422: {
                            error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
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
    };
} & {
    [x: string]: {
        "job-apply": {
            post: {
                body: {
                    jobUrl: string;
                    resumeId: string;
                    coverLetterId?: string | undefined;
                    jobId?: string | undefined;
                    customAnswers?: Record<string, string> | undefined;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        id: string;
                        type: "email" | "job_apply" | "scrape";
                        status: "cancelled" | "error" | "pending" | "running" | "success";
                        jobId: string | null;
                        userId: string | null;
                        input: Record<string, unknown> | null;
                        output: Record<string, unknown> | null;
                        screenshots: string[] | null;
                        error: string | {
                            code: string;
                            message: string;
                            source: string;
                            details?: Record<string, unknown> | undefined;
                        } | null;
                        progress: number | null;
                        currentStep: number | null;
                        totalSteps: number | null;
                        startedAt: string | null;
                        completedAt: string | null;
                        createdAt: string;
                        updatedAt: string;
                        exitCode: number | null;
                        timedOut: boolean;
                        aborted: boolean;
                        executionMs: number | null;
                    };
                    400: {
                        error: {
                            code: string;
                            message: string;
                            details?: Record<string, unknown> | undefined;
                        };
                    };
                    404: {
                        error: {
                            code: string;
                            message: string;
                            details?: Record<string, unknown> | undefined;
                        };
                    };
                    409: {
                        error: {
                            code: string;
                            message: string;
                            details?: Record<string, unknown> | undefined;
                        };
                    };
                    422: {
                        error: {
                            code: string;
                            message: string;
                            details?: Record<string, unknown> | undefined;
                        };
                    };
                    429: {
                        error: string;
                        code?: string | undefined;
                        details?: string | undefined;
                        fields?: string[] | undefined;
                        id?: string | undefined;
                    };
                    500: {
                        error: {
                            code: string;
                            message: string;
                            details?: Record<string, unknown> | undefined;
                        };
                    };
                };
                error: never;
            };
        };
    };
} & {
    [x: string]: {
        "job-apply": {
            schedule: {
                post: {
                    body: {
                        jobUrl: string;
                        resumeId: string;
                        coverLetterId?: string | undefined;
                        jobId?: string | undefined;
                        customAnswers?: Record<string, string> | undefined;
                        runAt: string;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            id: string;
                            type: "email" | "job_apply" | "scrape";
                            status: "cancelled" | "error" | "pending" | "running" | "success";
                            jobId: string | null;
                            userId: string | null;
                            input: Record<string, unknown> | null;
                            output: Record<string, unknown> | null;
                            screenshots: string[] | null;
                            error: string | {
                                code: string;
                                message: string;
                                source: string;
                                details?: Record<string, unknown> | undefined;
                            } | null;
                            progress: number | null;
                            currentStep: number | null;
                            totalSteps: number | null;
                            startedAt: string | null;
                            completedAt: string | null;
                            createdAt: string;
                            updatedAt: string;
                            exitCode: number | null;
                            timedOut: boolean;
                            aborted: boolean;
                            executionMs: number | null;
                        };
                        400: {
                            error: {
                                code: string;
                                message: string;
                                details?: Record<string, unknown> | undefined;
                            };
                        };
                        404: {
                            error: {
                                code: string;
                                message: string;
                                details?: Record<string, unknown> | undefined;
                            };
                        };
                        409: {
                            error: {
                                code: string;
                                message: string;
                                details?: Record<string, unknown> | undefined;
                            };
                        };
                        422: {
                            error: {
                                code: string;
                                message: string;
                                details?: Record<string, unknown> | undefined;
                            };
                        };
                        429: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
                        };
                        500: {
                            error: {
                                code: string;
                                message: string;
                                details?: Record<string, unknown> | undefined;
                            };
                        };
                    };
                    error: never;
                };
            };
        };
    };
} & {
    [x: string]: {
        "email-response": {
            post: {
                body: {
                    subject: string;
                    message: string;
                    sender?: string | undefined;
                    tone?: "concise" | "friendly" | "professional" | undefined;
                    recipientEmail?: string | undefined;
                    deliverAfterGeneration?: boolean | undefined;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        runId: string;
                        status: "success";
                        reply: string;
                        provider: string;
                        model: string;
                        delivered: boolean;
                        recipientEmail?: string | undefined;
                        deliveredAt?: string | undefined;
                        messageId?: string | undefined;
                    };
                    400: {
                        error: {
                            code: string;
                            message: string;
                            details?: Record<string, unknown> | undefined;
                        };
                    };
                    404: {
                        error: {
                            code: string;
                            message: string;
                            details?: Record<string, unknown> | undefined;
                        };
                    };
                    409: {
                        error: {
                            code: string;
                            message: string;
                            details?: Record<string, unknown> | undefined;
                        };
                    };
                    422: {
                        error: {
                            code: string;
                            message: string;
                            details?: Record<string, unknown> | undefined;
                        };
                    };
                    429: {
                        error: string;
                        code?: string | undefined;
                        details?: string | undefined;
                        fields?: string[] | undefined;
                        id?: string | undefined;
                    };
                    500: {
                        error: {
                            code: string;
                            message: string;
                            details?: Record<string, unknown> | undefined;
                        };
                    };
                };
                error: never;
            };
        };
    };
} & {
    [x: string]: {
        "email-response": {
            schedule: {
                post: {
                    body: {
                        subject: string;
                        message: string;
                        sender?: string | undefined;
                        tone?: "concise" | "friendly" | "professional" | undefined;
                        recipientEmail?: string | undefined;
                        deliverAfterGeneration?: boolean | undefined;
                        runAt: string;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            id: string;
                            type: "email" | "job_apply" | "scrape";
                            status: "cancelled" | "error" | "pending" | "running" | "success";
                            jobId: string | null;
                            userId: string | null;
                            input: Record<string, unknown> | null;
                            output: Record<string, unknown> | null;
                            screenshots: string[] | null;
                            error: string | {
                                code: string;
                                message: string;
                                source: string;
                                details?: Record<string, unknown> | undefined;
                            } | null;
                            progress: number | null;
                            currentStep: number | null;
                            totalSteps: number | null;
                            startedAt: string | null;
                            completedAt: string | null;
                            createdAt: string;
                            updatedAt: string;
                            exitCode: number | null;
                            timedOut: boolean;
                            aborted: boolean;
                            executionMs: number | null;
                        };
                        400: {
                            error: {
                                code: string;
                                message: string;
                                details?: Record<string, unknown> | undefined;
                            };
                        };
                        404: {
                            error: {
                                code: string;
                                message: string;
                                details?: Record<string, unknown> | undefined;
                            };
                        };
                        409: {
                            error: {
                                code: string;
                                message: string;
                                details?: Record<string, unknown> | undefined;
                            };
                        };
                        422: {
                            error: {
                                code: string;
                                message: string;
                                details?: Record<string, unknown> | undefined;
                            };
                        };
                        429: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
                        };
                        500: {
                            error: {
                                code: string;
                                message: string;
                                details?: Record<string, unknown> | undefined;
                            };
                        };
                    };
                    error: never;
                };
            };
        };
    };
} & {
    [x: string]: {
        scrape: {
            post: {
                body: {
                    target: "jobs_gamesjobsdirect" | "jobs_grackle" | "jobs_hitmarker" | "jobs_pocketgamer" | "jobs_remotegamejobs" | "jobs_workwithindies" | "studios";
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        id: string;
                        type: "email" | "job_apply" | "scrape";
                        status: "cancelled" | "error" | "pending" | "running" | "success";
                        jobId: string | null;
                        userId: string | null;
                        input: Record<string, unknown> | null;
                        output: Record<string, unknown> | null;
                        screenshots: string[] | null;
                        error: string | {
                            code: string;
                            message: string;
                            source: string;
                            details?: Record<string, unknown> | undefined;
                        } | null;
                        progress: number | null;
                        currentStep: number | null;
                        totalSteps: number | null;
                        startedAt: string | null;
                        completedAt: string | null;
                        createdAt: string;
                        updatedAt: string;
                        exitCode: number | null;
                        timedOut: boolean;
                        aborted: boolean;
                        executionMs: number | null;
                    };
                    400: {
                        error: {
                            code: string;
                            message: string;
                            details?: Record<string, unknown> | undefined;
                        };
                    };
                    404: {
                        error: {
                            code: string;
                            message: string;
                            details?: Record<string, unknown> | undefined;
                        };
                    };
                    409: {
                        error: {
                            code: string;
                            message: string;
                            details?: Record<string, unknown> | undefined;
                        };
                    };
                    422: {
                        error: {
                            code: string;
                            message: string;
                            details?: Record<string, unknown> | undefined;
                        };
                    };
                    429: {
                        error: string;
                        code?: string | undefined;
                        details?: string | undefined;
                        fields?: string[] | undefined;
                        id?: string | undefined;
                    };
                    500: {
                        error: {
                            code: string;
                            message: string;
                            details?: Record<string, unknown> | undefined;
                        };
                    };
                };
                error: never;
            };
        };
    };
} & {
    [x: string]: {
        scrape: {
            schedule: {
                post: {
                    body: {
                        target: "jobs_gamesjobsdirect" | "jobs_grackle" | "jobs_hitmarker" | "jobs_pocketgamer" | "jobs_remotegamejobs" | "jobs_workwithindies" | "studios";
                        runAt: string;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            id: string;
                            type: "email" | "job_apply" | "scrape";
                            status: "cancelled" | "error" | "pending" | "running" | "success";
                            jobId: string | null;
                            userId: string | null;
                            input: Record<string, unknown> | null;
                            output: Record<string, unknown> | null;
                            screenshots: string[] | null;
                            error: string | {
                                code: string;
                                message: string;
                                source: string;
                                details?: Record<string, unknown> | undefined;
                            } | null;
                            progress: number | null;
                            currentStep: number | null;
                            totalSteps: number | null;
                            startedAt: string | null;
                            completedAt: string | null;
                            createdAt: string;
                            updatedAt: string;
                            exitCode: number | null;
                            timedOut: boolean;
                            aborted: boolean;
                            executionMs: number | null;
                        };
                        400: {
                            error: {
                                code: string;
                                message: string;
                                details?: Record<string, unknown> | undefined;
                            };
                        };
                        404: {
                            error: {
                                code: string;
                                message: string;
                                details?: Record<string, unknown> | undefined;
                            };
                        };
                        409: {
                            error: {
                                code: string;
                                message: string;
                                details?: Record<string, unknown> | undefined;
                            };
                        };
                        422: {
                            error: {
                                code: string;
                                message: string;
                                details?: Record<string, unknown> | undefined;
                            };
                        };
                        429: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
                        };
                        500: {
                            error: {
                                code: string;
                                message: string;
                                details?: Record<string, unknown> | undefined;
                            };
                        };
                    };
                    error: never;
                };
            };
        };
    };
} & {
    [x: string]: {
        capabilities: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        generatedAt: string;
                        summary: {
                            total: number;
                            configured: number;
                            manualRunAvailable: number;
                            scheduledRunAvailable: number;
                            runHistoryAvailable: number;
                            liveUpdatesAvailable: number;
                        };
                        capabilities: {
                            id: string;
                            category: "job_apply" | "scrape";
                            name: string;
                            target: "jobs_gamesjobsdirect" | "jobs_grackle" | "jobs_hitmarker" | "jobs_pocketgamer" | "jobs_remotegamejobs" | "jobs_workwithindies" | "studios" | null;
                            implemented: boolean;
                            configured: boolean;
                            enabled: boolean;
                            manualRunAvailable: boolean;
                            scheduledRunAvailable: boolean;
                            runHistoryAvailable: boolean;
                            liveUpdatesAvailable: boolean;
                            issues: {
                                code: "chromium_executable_missing" | "portal_configuration_missing" | "portal_disabled" | "portal_fallback_url_missing" | "provider_settings_unavailable";
                                portalId?: string | undefined;
                                portalName?: string | undefined;
                                remediation?: string | undefined;
                            }[];
                        }[];
                    };
                    422: {
                        error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
                    };
                    429: {
                        error: string;
                        code?: string | undefined;
                        details?: string | undefined;
                        fields?: string[] | undefined;
                        id?: string | undefined;
                    };
                    500: {
                        error: {
                            code: string;
                            message: string;
                            details?: Record<string, unknown> | undefined;
                        };
                    };
                };
                error: never;
            };
        };
    };
} & {
    [x: string]: {
        runs: {
            get: {
                body: unknown;
                params: {};
                query: {
                    type?: "email" | "job_apply" | "scrape" | undefined;
                    status?: "cancelled" | "error" | "pending" | "running" | "success" | undefined;
                };
                headers: unknown;
                response: {
                    200: {
                        id: string;
                        type: "email" | "job_apply" | "scrape";
                        status: "cancelled" | "error" | "pending" | "running" | "success";
                        jobId: string | null;
                        userId: string | null;
                        input: Record<string, unknown> | null;
                        output: Record<string, unknown> | null;
                        screenshots: string[] | null;
                        error: string | {
                            code: string;
                            message: string;
                            source: string;
                            details?: Record<string, unknown> | undefined;
                        } | null;
                        progress: number | null;
                        currentStep: number | null;
                        totalSteps: number | null;
                        startedAt: string | null;
                        completedAt: string | null;
                        createdAt: string;
                        updatedAt: string;
                        exitCode: number | null;
                        timedOut: boolean;
                        aborted: boolean;
                        executionMs: number | null;
                    }[];
                    422: {
                        error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
                    } & {
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
                };
                error: never;
            };
        };
    };
}, import("elysia/types").DefaultEphemeral, {
    derive: {};
    schema: {};
    schemas: {};
    response: {
        422: {
            error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
        };
    };
    error: [];
}, "get", "/runs/:id", import("elysia/types").IntersectIfObjectSchema<import("elysia").UnwrapRoute<{
    detail: {
        tags: string[];
        description: string;
    };
    params: import("typebox").TObject<{
        id: import("typebox").TString;
    }>;
    response: {
        readonly 400: import("typebox").TObject<{
            error: import("typebox").TObject<{
                code: import("typebox").TString;
                message: import("typebox").TString;
                details: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
            }>;
        }>;
        readonly 404: import("typebox").TObject<{
            error: import("typebox").TObject<{
                code: import("typebox").TString;
                message: import("typebox").TString;
                details: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
            }>;
        }>;
        readonly 409: import("typebox").TObject<{
            error: import("typebox").TObject<{
                code: import("typebox").TString;
                message: import("typebox").TString;
                details: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
            }>;
        }>;
        readonly 422: import("typebox").TObject<{
            error: import("typebox").TObject<{
                code: import("typebox").TString;
                message: import("typebox").TString;
                details: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
            }>;
        }>;
        readonly 429: import("typebox").TObject<{
            error: import("typebox").TString;
            code: import("typebox").TOptional<import("typebox").TString>;
            details: import("typebox").TOptional<import("typebox").TString>;
            fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            id: import("typebox").TOptional<import("typebox").TString>;
        }>;
        readonly 500: import("typebox").TObject<{
            error: import("typebox").TObject<{
                code: import("typebox").TString;
                message: import("typebox").TString;
                details: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
            }>;
        }>;
        readonly 200: import("typebox").TObject<{
            id: import("typebox").TString;
            type: import("typebox").TUnion<[import("typebox").TLiteral<"scrape">, import("typebox").TLiteral<"job_apply">, import("typebox").TLiteral<"email">]>;
            status: import("typebox").TUnion<[import("typebox").TLiteral<"pending">, import("typebox").TLiteral<"running">, import("typebox").TLiteral<"success">, import("typebox").TLiteral<"error">, import("typebox").TLiteral<"cancelled">]>;
            jobId: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
            userId: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
            input: import("typebox").TUnion<[import("typebox").TRecord<"^.*$", import("typebox").TUnknown>, import("typebox").TNull]>;
            output: import("typebox").TUnion<[import("typebox").TUnion<[import("typebox").TRecord<"^.*$", import("typebox").TUnknown>, import("typebox").TNull]>, import("typebox").TNull]>;
            screenshots: import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>;
            error: import("typebox").TUnion<[import("typebox").TString, import("typebox").TObject<{
                code: import("typebox").TString;
                message: import("typebox").TString;
                source: import("typebox").TString;
                details: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
            }>, import("typebox").TNull]>;
            progress: import("typebox").TUnion<[import("typebox").TNumber, import("typebox").TNull]>;
            currentStep: import("typebox").TUnion<[import("typebox").TNumber, import("typebox").TNull]>;
            totalSteps: import("typebox").TUnion<[import("typebox").TNumber, import("typebox").TNull]>;
            startedAt: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
            completedAt: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
            createdAt: import("typebox").TString;
            updatedAt: import("typebox").TString;
            exitCode: import("typebox").TUnion<[import("typebox").TNumber, import("typebox").TNull]>;
            timedOut: import("typebox").TBoolean;
            aborted: import("typebox").TBoolean;
            executionMs: import("typebox").TUnion<[import("typebox").TNumber, import("typebox").TNull]>;
        }>;
    };
}, {}, `${string}/runs/:id`>, import("elysia/types").MergeScopedSchemas<{}, {}, {}>>, {}, ({ params, status }: {
    server: import("elysia").Server | null;
    redirect: import("elysia").redirect;
    set: {
        headers: import("elysia").HTTPHeaders;
        status?: number | keyof import("elysia").StatusMap;
        cookie?: Record<string, import("elysia").BaseCookie>;
    };
    status: import("elysia").SelectiveStatus<{
        readonly 400: {
            error: {
                code: string;
                message: string;
                details?: Record<string, unknown> | undefined;
            };
        };
        readonly 404: {
            error: {
                code: string;
                message: string;
                details?: Record<string, unknown> | undefined;
            };
        };
        readonly 409: {
            error: {
                code: string;
                message: string;
                details?: Record<string, unknown> | undefined;
            };
        };
        readonly 422: {
            error: {
                code: string;
                message: string;
                details?: Record<string, unknown> | undefined;
            };
        };
        readonly 429: {
            error: string;
            code?: string | undefined;
            details?: string | undefined;
            fields?: string[] | undefined;
            id?: string | undefined;
        };
        readonly 500: {
            error: {
                code: string;
                message: string;
                details?: Record<string, unknown> | undefined;
            };
        };
        readonly 200: {
            id: string;
            type: "email" | "job_apply" | "scrape";
            status: "cancelled" | "error" | "pending" | "running" | "success";
            jobId: string | null;
            userId: string | null;
            input: Record<string, unknown> | null;
            output: Record<string, unknown> | null;
            screenshots: string[] | null;
            error: string | {
                code: string;
                message: string;
                source: string;
                details?: Record<string, unknown> | undefined;
            } | null;
            progress: number | null;
            currentStep: number | null;
            totalSteps: number | null;
            startedAt: string | null;
            completedAt: string | null;
            createdAt: string;
            updatedAt: string;
            exitCode: number | null;
            timedOut: boolean;
            aborted: boolean;
            executionMs: number | null;
        };
    }>;
    readonly path: string;
    route?: string;
    rid?: string;
    request: Request;
    store: {};
    body: unknown;
    query: Record<string, string | undefined>;
    params: {
        id: string;
    };
    headers: Record<string, string | undefined>;
    cookie: Record<string, import("elysia").Cookie<unknown>>;
}) => Promise<import("elysia").ElysiaStatus<200, {
    id: string;
    type: "email" | "job_apply" | "scrape";
    status: "cancelled" | "error" | "pending" | "running" | "success";
    jobId: string | null;
    userId: string | null;
    input: import("@bao/shared/utils/json").JsonObject | null;
    output: import("@bao/shared/utils/json").JsonObject | {
        success: boolean;
        error: string | null;
        screenshots: string[];
        artifacts: {
            id: string;
            kind: "document" | "log" | "screenshot" | "trace";
            path: string;
            label?: string | undefined;
            mimeType?: string | undefined;
        }[];
        steps: {
            action: string;
            status: "error" | "ok" | "skipped";
            message?: string | undefined;
        }[];
    } | null;
    screenshots: string[] | null;
    error: string | {
        code: "AUTOMATION_CANCELLED" | "AUTOMATION_RUNTIME_ERROR" | "AUTOMATION_TIMEOUT" | "NETWORK_ERROR" | "OUTPUT_PERSISTENCE_ERROR" | "OUTPUT_VALIDATION_ERROR" | "SCRIPT_OUTPUT_INVALID" | "SCRIPT_PROTOCOL_ERROR" | "UNKNOWN_ERROR";
        message: string;
        details?: import("@bao/shared/utils/json").JsonObject | undefined;
        source: string;
    } | null;
    progress: number | null;
    currentStep: number | null;
    totalSteps: number | null;
    startedAt: string | null;
    completedAt: string | null;
    createdAt: string;
    updatedAt: string;
    exitCode: number | null;
    timedOut: boolean;
    aborted: boolean;
    executionMs: number | null;
}, 200> | import("elysia").ElysiaStatus<400, {
    error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
}, 400> | import("elysia").ElysiaStatus<400 | 404, {
    error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
}, 400 | 404>>>;
