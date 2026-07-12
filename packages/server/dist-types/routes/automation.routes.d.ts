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
    };
} & {
    [x: string]: {
        "job-apply": {
            post: {
                body: {
                    jobUrl: string;
                    resumeId: string;
                } & {
                    coverLetterId?: string | undefined;
                    customAnswers?: Record<string, string> | undefined;
                    jobId?: string | undefined;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        aborted: boolean;
                        completedAt: string | null;
                        createdAt: string;
                        currentStep: number | null;
                        error: string | ({
                            code: string;
                            message: string;
                            source: string;
                        } & {
                            details?: Record<string, unknown> | undefined;
                        }) | null;
                        executionMs: number | null;
                        exitCode: number | null;
                        id: string;
                        input: Record<string, unknown> | null;
                        jobId: string | null;
                        output: Record<string, unknown> | null;
                        progress: number | null;
                        screenshots: string[] | null;
                        startedAt: string | null;
                        status: "error" | "pending" | "running" | "success";
                        timedOut: boolean;
                        totalSteps: number | null;
                        type: "email" | "job_apply" | "scrape";
                        updatedAt: string;
                        userId: string | null;
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
                    500: {
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
                        jobUrl: string;
                        resumeId: string;
                        runAt: string;
                    } & {
                        coverLetterId?: string | undefined;
                        customAnswers?: Record<string, string> | undefined;
                        jobId?: string | undefined;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            aborted: boolean;
                            completedAt: string | null;
                            createdAt: string;
                            currentStep: number | null;
                            error: string | ({
                                code: string;
                                message: string;
                                source: string;
                            } & {
                                details?: Record<string, unknown> | undefined;
                            }) | null;
                            executionMs: number | null;
                            exitCode: number | null;
                            id: string;
                            input: Record<string, unknown> | null;
                            jobId: string | null;
                            output: Record<string, unknown> | null;
                            progress: number | null;
                            screenshots: string[] | null;
                            startedAt: string | null;
                            status: "error" | "pending" | "running" | "success";
                            timedOut: boolean;
                            totalSteps: number | null;
                            type: "email" | "job_apply" | "scrape";
                            updatedAt: string;
                            userId: string | null;
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
                        500: {
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
                    deliverAfterGeneration?: boolean | undefined;
                    recipientEmail?: string | undefined;
                    sender?: string | undefined;
                    tone?: "concise" | "friendly" | "professional" | undefined;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        delivered: boolean;
                        model: string;
                        provider: string;
                        reply: string;
                        runId: string;
                        status: "success";
                    } & {
                        deliveredAt?: string | undefined;
                        messageId?: string | undefined;
                        recipientEmail?: string | undefined;
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
                    500: {
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
                        runAt: string;
                        subject: string;
                    } & {
                        deliverAfterGeneration?: boolean | undefined;
                        recipientEmail?: string | undefined;
                        sender?: string | undefined;
                        tone?: "concise" | "friendly" | "professional" | undefined;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            aborted: boolean;
                            completedAt: string | null;
                            createdAt: string;
                            currentStep: number | null;
                            error: string | ({
                                code: string;
                                message: string;
                                source: string;
                            } & {
                                details?: Record<string, unknown> | undefined;
                            }) | null;
                            executionMs: number | null;
                            exitCode: number | null;
                            id: string;
                            input: Record<string, unknown> | null;
                            jobId: string | null;
                            output: Record<string, unknown> | null;
                            progress: number | null;
                            screenshots: string[] | null;
                            startedAt: string | null;
                            status: "error" | "pending" | "running" | "success";
                            timedOut: boolean;
                            totalSteps: number | null;
                            type: "email" | "job_apply" | "scrape";
                            updatedAt: string;
                            userId: string | null;
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
                        500: {
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
                    target: "jobs_gamesjobsdirect" | "jobs_grackle" | "jobs_hitmarker" | "jobs_pocketgamer" | "jobs_remotegamejobs" | "jobs_workwithindies" | "studios";
                } & {};
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        aborted: boolean;
                        completedAt: string | null;
                        createdAt: string;
                        currentStep: number | null;
                        error: string | ({
                            code: string;
                            message: string;
                            source: string;
                        } & {
                            details?: Record<string, unknown> | undefined;
                        }) | null;
                        executionMs: number | null;
                        exitCode: number | null;
                        id: string;
                        input: Record<string, unknown> | null;
                        jobId: string | null;
                        output: Record<string, unknown> | null;
                        progress: number | null;
                        screenshots: string[] | null;
                        startedAt: string | null;
                        status: "error" | "pending" | "running" | "success";
                        timedOut: boolean;
                        totalSteps: number | null;
                        type: "email" | "job_apply" | "scrape";
                        updatedAt: string;
                        userId: string | null;
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
                    500: {
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
                        runAt: string;
                        target: "jobs_gamesjobsdirect" | "jobs_grackle" | "jobs_hitmarker" | "jobs_pocketgamer" | "jobs_remotegamejobs" | "jobs_workwithindies" | "studios";
                    } & {};
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            aborted: boolean;
                            completedAt: string | null;
                            createdAt: string;
                            currentStep: number | null;
                            error: string | ({
                                code: string;
                                message: string;
                                source: string;
                            } & {
                                details?: Record<string, unknown> | undefined;
                            }) | null;
                            executionMs: number | null;
                            exitCode: number | null;
                            id: string;
                            input: Record<string, unknown> | null;
                            jobId: string | null;
                            output: Record<string, unknown> | null;
                            progress: number | null;
                            screenshots: string[] | null;
                            startedAt: string | null;
                            status: "error" | "pending" | "running" | "success";
                            timedOut: boolean;
                            totalSteps: number | null;
                            type: "email" | "job_apply" | "scrape";
                            updatedAt: string;
                            userId: string | null;
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
                        500: {
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
                    200: {
                        capabilities: ({
                            category: "job_apply" | "scrape";
                            configured: boolean;
                            enabled: boolean;
                            id: string;
                            implemented: boolean;
                            issues: ({
                                code: "portal_configuration_missing" | "portal_disabled" | "portal_fallback_url_missing" | "provider_settings_unavailable";
                            } & {
                                portalId?: string | undefined;
                                portalName?: string | undefined;
                            })[];
                            liveUpdatesAvailable: boolean;
                            manualRunAvailable: boolean;
                            name: string;
                            runHistoryAvailable: boolean;
                            scheduledRunAvailable: boolean;
                            target: "jobs_gamesjobsdirect" | "jobs_grackle" | "jobs_hitmarker" | "jobs_pocketgamer" | "jobs_remotegamejobs" | "jobs_workwithindies" | "studios" | null;
                        } & {})[];
                        generatedAt: string;
                        summary: {
                            configured: number;
                            liveUpdatesAvailable: number;
                            manualRunAvailable: number;
                            runHistoryAvailable: number;
                            scheduledRunAvailable: number;
                            total: number;
                        } & {};
                    } & {};
                    422: {
                        type: 'validation';
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                    500: {
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
        runs: {
            get: {
                body: unknown;
                params: {};
                query: {} & {
                    status?: "error" | "pending" | "running" | "success" | undefined;
                    type?: "email" | "job_apply" | "scrape" | undefined;
                };
                headers: unknown;
                response: {
                    200: ({
                        aborted: boolean;
                        completedAt: string | null;
                        createdAt: string;
                        currentStep: number | null;
                        error: string | ({
                            code: string;
                            message: string;
                            source: string;
                        } & {
                            details?: Record<string, unknown> | undefined;
                        }) | null;
                        executionMs: number | null;
                        exitCode: number | null;
                        id: string;
                        input: Record<string, unknown> | null;
                        jobId: string | null;
                        output: Record<string, unknown> | null;
                        progress: number | null;
                        screenshots: string[] | null;
                        startedAt: string | null;
                        status: "error" | "pending" | "running" | "success";
                        timedOut: boolean;
                        totalSteps: number | null;
                        type: "email" | "job_apply" | "scrape";
                        updatedAt: string;
                        userId: string | null;
                    } & {})[];
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
                            aborted: boolean;
                            completedAt: string | null;
                            createdAt: string;
                            currentStep: number | null;
                            error: string | ({
                                code: string;
                                message: string;
                                source: string;
                            } & {
                                details?: Record<string, unknown> | undefined;
                            }) | null;
                            executionMs: number | null;
                            exitCode: number | null;
                            id: string;
                            input: Record<string, unknown> | null;
                            jobId: string | null;
                            output: Record<string, unknown> | null;
                            progress: number | null;
                            screenshots: string[] | null;
                            startedAt: string | null;
                            status: "error" | "pending" | "running" | "success";
                            timedOut: boolean;
                            totalSteps: number | null;
                            type: "email" | "job_apply" | "scrape";
                            updatedAt: string;
                            userId: string | null;
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
