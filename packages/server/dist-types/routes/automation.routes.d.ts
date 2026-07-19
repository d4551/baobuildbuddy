import { type status } from "elysia";
import { type AutomationRunIdParams } from "./automation-route-contracts";
type RouteStatus = typeof status;
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
                        200: unknown;
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
                    200: unknown;
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
                        200: unknown;
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
                    200: unknown;
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
                        200: unknown;
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
                    200: unknown;
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
                        200: unknown;
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
                    200: unknown;
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
                    status?: "error" | "pending" | "running" | "success" | undefined;
                };
                headers: unknown;
                response: {
                    200: unknown;
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
        readonly 200: import("typebox").TUnknown;
    };
}, {}, `${string}/runs/:id`>, import("elysia/types").MergeScopedSchemas<{}, {}, {}>>, {}, ({ params, status }: {
    params: AutomationRunIdParams;
    status: RouteStatus;
}) => Promise<import("elysia").ElysiaStatus<400, {
    error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
}, 400> | import("elysia").ElysiaStatus<200 | 400 | 404, {
    id: string;
    type: "email" | "job_apply" | "scrape";
    status: "error" | "pending" | "running" | "success";
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
            status: "error" | "ok";
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
} | {
    error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
}, 200 | 400 | 404>>>;
export {};
