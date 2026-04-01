import { Elysia } from "elysia";
/**
 * Automation API routes for RPA-driven workflows and run history.
 */
export declare const automationRoutes: Elysia<string, {
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
                        } & {};
                        404: {
                            error: {
                                code: string;
                                message: string;
                            } & {
                                details?: Record<string, unknown> | undefined;
                            };
                        } & {};
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
    };
} & {
    [x: string]: {
        "job-apply": {
            post: {
                body: {
                    resumeId: string;
                    jobUrl: string;
                } & {
                    jobId?: string | undefined;
                    coverLetterId?: string | undefined;
                    customAnswers?: Record<string, string> | undefined;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    500: {
                        error: {
                            code: string;
                            message: string;
                        } & {
                            details?: Record<string, unknown> | undefined;
                        };
                    } & {};
                    200: {
                        error: string | ({
                            code: string;
                            source: string;
                            message: string;
                        } & {
                            details?: Record<string, unknown> | undefined;
                        }) | null;
                        id: string;
                        aborted: boolean;
                        type: "scrape" | "job_apply" | "email";
                        output: Record<string, unknown> | null;
                        input: Record<string, unknown> | null;
                        progress: number | null;
                        screenshots: string[] | null;
                        status: "error" | "success" | "pending" | "running";
                        jobId: string | null;
                        userId: string | null;
                        currentStep: number | null;
                        totalSteps: number | null;
                        exitCode: number | null;
                        timedOut: boolean;
                        executionMs: number | null;
                        startedAt: string | null;
                        completedAt: string | null;
                        createdAt: string;
                        updatedAt: string;
                    } & {};
                    400: {
                        error: {
                            code: string;
                            message: string;
                        } & {
                            details?: Record<string, unknown> | undefined;
                        };
                    } & {};
                    404: {
                        error: {
                            code: string;
                            message: string;
                        } & {
                            details?: Record<string, unknown> | undefined;
                        };
                    } & {};
                    409: {
                        error: {
                            code: string;
                            message: string;
                        } & {
                            details?: Record<string, unknown> | undefined;
                        };
                    } & {};
                    422: {
                        error: {
                            code: string;
                            message: string;
                        } & {
                            details?: Record<string, unknown> | undefined;
                        };
                    } & {};
                };
            };
        };
    };
} & {
    [x: string]: {
        "job-apply": {
            schedule: {
                post: {
                    body: {
                        resumeId: string;
                        jobUrl: string;
                        runAt: string;
                    } & {
                        jobId?: string | undefined;
                        coverLetterId?: string | undefined;
                        customAnswers?: Record<string, string> | undefined;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        500: {
                            error: {
                                code: string;
                                message: string;
                            } & {
                                details?: Record<string, unknown> | undefined;
                            };
                        } & {};
                        200: {
                            error: string | ({
                                code: string;
                                source: string;
                                message: string;
                            } & {
                                details?: Record<string, unknown> | undefined;
                            }) | null;
                            id: string;
                            aborted: boolean;
                            type: "scrape" | "job_apply" | "email";
                            output: Record<string, unknown> | null;
                            input: Record<string, unknown> | null;
                            progress: number | null;
                            screenshots: string[] | null;
                            status: "error" | "success" | "pending" | "running";
                            jobId: string | null;
                            userId: string | null;
                            currentStep: number | null;
                            totalSteps: number | null;
                            exitCode: number | null;
                            timedOut: boolean;
                            executionMs: number | null;
                            startedAt: string | null;
                            completedAt: string | null;
                            createdAt: string;
                            updatedAt: string;
                        } & {};
                        400: {
                            error: {
                                code: string;
                                message: string;
                            } & {
                                details?: Record<string, unknown> | undefined;
                            };
                        } & {};
                        404: {
                            error: {
                                code: string;
                                message: string;
                            } & {
                                details?: Record<string, unknown> | undefined;
                            };
                        } & {};
                        409: {
                            error: {
                                code: string;
                                message: string;
                            } & {
                                details?: Record<string, unknown> | undefined;
                            };
                        } & {};
                        422: {
                            error: {
                                code: string;
                                message: string;
                            } & {
                                details?: Record<string, unknown> | undefined;
                            };
                        } & {};
                    };
                };
            };
        };
    };
} & {
    [x: string]: {
        "email-response": {
            post: {
                body: {
                    message: string;
                    subject: string;
                } & {
                    sender?: string | undefined;
                    tone?: "professional" | "friendly" | "concise" | undefined;
                    recipientEmail?: string | undefined;
                    deliverAfterGeneration?: boolean | undefined;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    500: {
                        error: {
                            code: string;
                            message: string;
                        } & {
                            details?: Record<string, unknown> | undefined;
                        };
                    } & {};
                    200: {
                        provider: string;
                        model: string;
                        status: "success";
                        runId: string;
                        reply: string;
                        delivered: boolean;
                    } & {
                        recipientEmail?: string | undefined;
                        deliveredAt?: string | undefined;
                        messageId?: string | undefined;
                    };
                    400: {
                        error: {
                            code: string;
                            message: string;
                        } & {
                            details?: Record<string, unknown> | undefined;
                        };
                    } & {};
                    404: {
                        error: {
                            code: string;
                            message: string;
                        } & {
                            details?: Record<string, unknown> | undefined;
                        };
                    } & {};
                    409: {
                        error: {
                            code: string;
                            message: string;
                        } & {
                            details?: Record<string, unknown> | undefined;
                        };
                    } & {};
                    422: {
                        error: {
                            code: string;
                            message: string;
                        } & {
                            details?: Record<string, unknown> | undefined;
                        };
                    } & {};
                };
            };
        };
    };
} & {
    [x: string]: {
        "email-response": {
            schedule: {
                post: {
                    body: {
                        message: string;
                        subject: string;
                        runAt: string;
                    } & {
                        sender?: string | undefined;
                        tone?: "professional" | "friendly" | "concise" | undefined;
                        recipientEmail?: string | undefined;
                        deliverAfterGeneration?: boolean | undefined;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        500: {
                            error: {
                                code: string;
                                message: string;
                            } & {
                                details?: Record<string, unknown> | undefined;
                            };
                        } & {};
                        200: {
                            error: string | ({
                                code: string;
                                source: string;
                                message: string;
                            } & {
                                details?: Record<string, unknown> | undefined;
                            }) | null;
                            id: string;
                            aborted: boolean;
                            type: "scrape" | "job_apply" | "email";
                            output: Record<string, unknown> | null;
                            input: Record<string, unknown> | null;
                            progress: number | null;
                            screenshots: string[] | null;
                            status: "error" | "success" | "pending" | "running";
                            jobId: string | null;
                            userId: string | null;
                            currentStep: number | null;
                            totalSteps: number | null;
                            exitCode: number | null;
                            timedOut: boolean;
                            executionMs: number | null;
                            startedAt: string | null;
                            completedAt: string | null;
                            createdAt: string;
                            updatedAt: string;
                        } & {};
                        400: {
                            error: {
                                code: string;
                                message: string;
                            } & {
                                details?: Record<string, unknown> | undefined;
                            };
                        } & {};
                        404: {
                            error: {
                                code: string;
                                message: string;
                            } & {
                                details?: Record<string, unknown> | undefined;
                            };
                        } & {};
                        409: {
                            error: {
                                code: string;
                                message: string;
                            } & {
                                details?: Record<string, unknown> | undefined;
                            };
                        } & {};
                        422: {
                            error: {
                                code: string;
                                message: string;
                            } & {
                                details?: Record<string, unknown> | undefined;
                            };
                        } & {};
                    };
                };
            };
        };
    };
} & {
    [x: string]: {
        scrape: {
            post: {
                body: {
                    target: "jobs_hitmarker" | "jobs_grackle" | "jobs_workwithindies" | "jobs_remotegamejobs" | "jobs_gamesjobsdirect" | "jobs_pocketgamer" | "studios";
                } & {};
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    500: {
                        error: {
                            code: string;
                            message: string;
                        } & {
                            details?: Record<string, unknown> | undefined;
                        };
                    } & {};
                    200: {
                        error: string | ({
                            code: string;
                            source: string;
                            message: string;
                        } & {
                            details?: Record<string, unknown> | undefined;
                        }) | null;
                        id: string;
                        aborted: boolean;
                        type: "scrape" | "job_apply" | "email";
                        output: Record<string, unknown> | null;
                        input: Record<string, unknown> | null;
                        progress: number | null;
                        screenshots: string[] | null;
                        status: "error" | "success" | "pending" | "running";
                        jobId: string | null;
                        userId: string | null;
                        currentStep: number | null;
                        totalSteps: number | null;
                        exitCode: number | null;
                        timedOut: boolean;
                        executionMs: number | null;
                        startedAt: string | null;
                        completedAt: string | null;
                        createdAt: string;
                        updatedAt: string;
                    } & {};
                    400: {
                        error: {
                            code: string;
                            message: string;
                        } & {
                            details?: Record<string, unknown> | undefined;
                        };
                    } & {};
                    404: {
                        error: {
                            code: string;
                            message: string;
                        } & {
                            details?: Record<string, unknown> | undefined;
                        };
                    } & {};
                    409: {
                        error: {
                            code: string;
                            message: string;
                        } & {
                            details?: Record<string, unknown> | undefined;
                        };
                    } & {};
                    422: {
                        error: {
                            code: string;
                            message: string;
                        } & {
                            details?: Record<string, unknown> | undefined;
                        };
                    } & {};
                };
            };
        };
    };
} & {
    [x: string]: {
        scrape: {
            schedule: {
                post: {
                    body: {
                        target: "jobs_hitmarker" | "jobs_grackle" | "jobs_workwithindies" | "jobs_remotegamejobs" | "jobs_gamesjobsdirect" | "jobs_pocketgamer" | "studios";
                        runAt: string;
                    } & {};
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        500: {
                            error: {
                                code: string;
                                message: string;
                            } & {
                                details?: Record<string, unknown> | undefined;
                            };
                        } & {};
                        200: {
                            error: string | ({
                                code: string;
                                source: string;
                                message: string;
                            } & {
                                details?: Record<string, unknown> | undefined;
                            }) | null;
                            id: string;
                            aborted: boolean;
                            type: "scrape" | "job_apply" | "email";
                            output: Record<string, unknown> | null;
                            input: Record<string, unknown> | null;
                            progress: number | null;
                            screenshots: string[] | null;
                            status: "error" | "success" | "pending" | "running";
                            jobId: string | null;
                            userId: string | null;
                            currentStep: number | null;
                            totalSteps: number | null;
                            exitCode: number | null;
                            timedOut: boolean;
                            executionMs: number | null;
                            startedAt: string | null;
                            completedAt: string | null;
                            createdAt: string;
                            updatedAt: string;
                        } & {};
                        400: {
                            error: {
                                code: string;
                                message: string;
                            } & {
                                details?: Record<string, unknown> | undefined;
                            };
                        } & {};
                        404: {
                            error: {
                                code: string;
                                message: string;
                            } & {
                                details?: Record<string, unknown> | undefined;
                            };
                        } & {};
                        409: {
                            error: {
                                code: string;
                                message: string;
                            } & {
                                details?: Record<string, unknown> | undefined;
                            };
                        } & {};
                        422: {
                            error: {
                                code: string;
                                message: string;
                            } & {
                                details?: Record<string, unknown> | undefined;
                            };
                        } & {};
                    };
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
                    500: {
                        error: {
                            code: string;
                            message: string;
                        } & {
                            details?: Record<string, unknown> | undefined;
                        };
                    } & {};
                    200: {
                        summary: {
                            configured: number;
                            manualRunAvailable: number;
                            scheduledRunAvailable: number;
                            runHistoryAvailable: number;
                            liveUpdatesAvailable: number;
                            total: number;
                        } & {};
                        capabilities: ({
                            name: string;
                            id: string;
                            category: "scrape" | "job_apply";
                            enabled: boolean;
                            target: "jobs_hitmarker" | "jobs_grackle" | "jobs_workwithindies" | "jobs_remotegamejobs" | "jobs_gamesjobsdirect" | "jobs_pocketgamer" | "studios" | null;
                            issues: ({
                                code: "provider_settings_unavailable" | "portal_configuration_missing" | "portal_disabled" | "portal_fallback_url_missing";
                            } & {
                                portalId?: string | undefined;
                                portalName?: string | undefined;
                            })[];
                            configured: boolean;
                            implemented: boolean;
                            manualRunAvailable: boolean;
                            scheduledRunAvailable: boolean;
                            runHistoryAvailable: boolean;
                            liveUpdatesAvailable: boolean;
                        } & {})[];
                        generatedAt: string;
                    } & {};
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
    [x: string]: {
        runs: {
            get: {
                body: unknown;
                params: {};
                query: {} & {
                    type?: "scrape" | "job_apply" | "email" | undefined;
                    status?: "error" | "success" | "pending" | "running" | undefined;
                };
                headers: unknown;
                response: {
                    200: ({
                        error: string | ({
                            code: string;
                            source: string;
                            message: string;
                        } & {
                            details?: Record<string, unknown> | undefined;
                        }) | null;
                        id: string;
                        aborted: boolean;
                        type: "scrape" | "job_apply" | "email";
                        output: Record<string, unknown> | null;
                        input: Record<string, unknown> | null;
                        progress: number | null;
                        screenshots: string[] | null;
                        status: "error" | "success" | "pending" | "running";
                        jobId: string | null;
                        userId: string | null;
                        currentStep: number | null;
                        totalSteps: number | null;
                        exitCode: number | null;
                        timedOut: boolean;
                        executionMs: number | null;
                        startedAt: string | null;
                        completedAt: string | null;
                        createdAt: string;
                        updatedAt: string;
                    } & {})[];
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
    [x: string]: {
        runs: {
            ":id": {
                get: {
                    body: unknown;
                    params: {
                        id: string;
                    } & {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            error: string | ({
                                code: string;
                                source: string;
                                message: string;
                            } & {
                                details?: Record<string, unknown> | undefined;
                            }) | null;
                            id: string;
                            aborted: boolean;
                            type: "scrape" | "job_apply" | "email";
                            output: Record<string, unknown> | null;
                            input: Record<string, unknown> | null;
                            progress: number | null;
                            screenshots: string[] | null;
                            status: "error" | "success" | "pending" | "running";
                            jobId: string | null;
                            userId: string | null;
                            currentStep: number | null;
                            totalSteps: number | null;
                            exitCode: number | null;
                            timedOut: boolean;
                            executionMs: number | null;
                            startedAt: string | null;
                            completedAt: string | null;
                            createdAt: string;
                            updatedAt: string;
                        } & {};
                        400: {
                            error: {
                                code: string;
                                message: string;
                            } & {
                                details?: Record<string, unknown> | undefined;
                            };
                        } & {};
                        404: {
                            error: {
                                code: string;
                                message: string;
                            } & {
                                details?: Record<string, unknown> | undefined;
                            };
                        } & {};
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
    response: {
        200: {
            error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
        };
    };
}>;
