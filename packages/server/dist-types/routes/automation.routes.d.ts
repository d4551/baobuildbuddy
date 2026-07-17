import type { RouteSetState } from "../types/route-state";
import { type AutomationRunIdParams } from "./automation-route-contracts";
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
                            error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
                        } | {
                            resumeId: string;
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
                        status: "error" | "pending" | "running" | "success";
                        jobId: string | null;
                        userId: string | null;
                        input: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | null;
                        output: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | {
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
                            details?: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | undefined;
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
                    } | {
                        error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
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
                            status: "error" | "pending" | "running" | "success";
                            jobId: string | null;
                            userId: string | null;
                            input: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | null;
                            output: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | {
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
                                details?: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | undefined;
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
                        } | {
                            error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
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
                    } | {
                        error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
                    } | {
                        error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
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
                            status: "error" | "pending" | "running" | "success";
                            jobId: string | null;
                            userId: string | null;
                            input: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | null;
                            output: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | {
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
                                details?: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | undefined;
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
                        } | {
                            error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
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
                        status: "error" | "pending" | "running" | "success";
                        jobId: string | null;
                        userId: string | null;
                        input: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | null;
                        output: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | {
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
                            details?: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | undefined;
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
                    } | {
                        error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
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
                            status: "error" | "pending" | "running" | "success";
                            jobId: string | null;
                            userId: string | null;
                            input: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | null;
                            output: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | {
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
                                details?: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | undefined;
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
                        } | {
                            error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
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
                    200: import("@bao/shared/constants/automation").RpaCapabilityAuditReport | {
                        error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
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
                    200: {
                        id: string;
                        type: "email" | "job_apply" | "scrape";
                        status: "error" | "pending" | "running" | "success";
                        jobId: string | null;
                        userId: string | null;
                        input: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | null;
                        output: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | {
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
                            details?: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | undefined;
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
                    }[] | {
                        error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
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
}, import("elysia/types").DefaultEphemeral, {
    derive: {};
    schema: {};
    schemas: {};
    response: {
        200: {
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
}, {}, `${string}/runs/:id`>, import("elysia/types").MergeScopedSchemas<{}, {}, {}>>, {}, ({ params, set }: {
    params: AutomationRunIdParams;
    set: RouteSetState;
}) => Promise<{
    id: string;
    type: "email" | "job_apply" | "scrape";
    status: "error" | "pending" | "running" | "success";
    jobId: string | null;
    userId: string | null;
    input: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | null;
    output: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | {
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
        details?: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | undefined;
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
}>>;
