import { Elysia } from "elysia";
/**
 * Automation API routes for RPA-driven workflows and run history.
 */
export declare const automationRoutes: Elysia<"/automation", {
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
    automation: {};
} & {
    automation: {
        verify: {
            context: {
                get: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {} & {
                            resumeId?: string | undefined;
                        };
                        404: {} & {
                            error?: ({} & {
                                code?: string | undefined;
                                message?: string | undefined;
                                details?: Record<string, unknown> | undefined;
                            }) | undefined;
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
    };
} & {
    automation: {
        "job-apply": {
            post: {
                body: {
                    resumeId: string;
                    jobUrl: string;
                } & {
                    customAnswers?: Record<string, string> | undefined;
                    coverLetterId?: string | undefined;
                    jobId?: string | undefined;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    500: {} & {
                        error?: ({} & {
                            code?: string | undefined;
                            message?: string | undefined;
                            details?: Record<string, unknown> | undefined;
                        }) | undefined;
                    };
                    200: {} & {
                        error?: string | ({} & {
                            code?: string | undefined;
                            source?: string | undefined;
                            message?: string | undefined;
                            details?: Record<string, unknown> | undefined;
                        }) | null | undefined;
                        id?: string | undefined;
                        aborted?: boolean | undefined;
                        type?: "scrape" | "job_apply" | "email" | undefined;
                        output?: Record<string, unknown> | null | undefined;
                        input?: Record<string, unknown> | null | undefined;
                        progress?: number | null | undefined;
                        status?: "error" | "success" | "pending" | "running" | undefined;
                        updatedAt?: string | undefined;
                        createdAt?: string | undefined;
                        screenshots?: string[] | null | undefined;
                        totalSteps?: number | null | undefined;
                        jobId?: string | null | undefined;
                        userId?: string | null | undefined;
                        currentStep?: number | null | undefined;
                        startedAt?: string | null | undefined;
                        completedAt?: string | null | undefined;
                        exitCode?: number | null | undefined;
                        timedOut?: boolean | undefined;
                        executionMs?: number | null | undefined;
                    };
                    400: {} & {
                        error?: ({} & {
                            code?: string | undefined;
                            message?: string | undefined;
                            details?: Record<string, unknown> | undefined;
                        }) | undefined;
                    };
                    404: {} & {
                        error?: ({} & {
                            code?: string | undefined;
                            message?: string | undefined;
                            details?: Record<string, unknown> | undefined;
                        }) | undefined;
                    };
                    409: {} & {
                        error?: ({} & {
                            code?: string | undefined;
                            message?: string | undefined;
                            details?: Record<string, unknown> | undefined;
                        }) | undefined;
                    };
                    422: {} & {
                        error?: ({} & {
                            code?: string | undefined;
                            message?: string | undefined;
                            details?: Record<string, unknown> | undefined;
                        }) | undefined;
                    };
                };
            };
        };
    };
} & {
    automation: {
        "job-apply": {
            schedule: {
                post: {
                    body: {
                        resumeId: string;
                        jobUrl: string;
                        runAt: string;
                    } & {
                        customAnswers?: Record<string, string> | undefined;
                        coverLetterId?: string | undefined;
                        jobId?: string | undefined;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        500: {} & {
                            error?: ({} & {
                                code?: string | undefined;
                                message?: string | undefined;
                                details?: Record<string, unknown> | undefined;
                            }) | undefined;
                        };
                        200: {} & {
                            error?: string | ({} & {
                                code?: string | undefined;
                                source?: string | undefined;
                                message?: string | undefined;
                                details?: Record<string, unknown> | undefined;
                            }) | null | undefined;
                            id?: string | undefined;
                            aborted?: boolean | undefined;
                            type?: "scrape" | "job_apply" | "email" | undefined;
                            output?: Record<string, unknown> | null | undefined;
                            input?: Record<string, unknown> | null | undefined;
                            progress?: number | null | undefined;
                            status?: "error" | "success" | "pending" | "running" | undefined;
                            updatedAt?: string | undefined;
                            createdAt?: string | undefined;
                            screenshots?: string[] | null | undefined;
                            totalSteps?: number | null | undefined;
                            jobId?: string | null | undefined;
                            userId?: string | null | undefined;
                            currentStep?: number | null | undefined;
                            startedAt?: string | null | undefined;
                            completedAt?: string | null | undefined;
                            exitCode?: number | null | undefined;
                            timedOut?: boolean | undefined;
                            executionMs?: number | null | undefined;
                        };
                        400: {} & {
                            error?: ({} & {
                                code?: string | undefined;
                                message?: string | undefined;
                                details?: Record<string, unknown> | undefined;
                            }) | undefined;
                        };
                        404: {} & {
                            error?: ({} & {
                                code?: string | undefined;
                                message?: string | undefined;
                                details?: Record<string, unknown> | undefined;
                            }) | undefined;
                        };
                        409: {} & {
                            error?: ({} & {
                                code?: string | undefined;
                                message?: string | undefined;
                                details?: Record<string, unknown> | undefined;
                            }) | undefined;
                        };
                        422: {} & {
                            error?: ({} & {
                                code?: string | undefined;
                                message?: string | undefined;
                                details?: Record<string, unknown> | undefined;
                            }) | undefined;
                        };
                    };
                };
            };
        };
    };
} & {
    automation: {
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
                    500: {} & {
                        error?: ({} & {
                            code?: string | undefined;
                            message?: string | undefined;
                            details?: Record<string, unknown> | undefined;
                        }) | undefined;
                    };
                    200: {} & {
                        provider?: string | undefined;
                        model?: string | undefined;
                        recipientEmail?: string | undefined;
                        runId?: string | undefined;
                        status?: "success" | undefined;
                        reply?: string | undefined;
                        delivered?: boolean | undefined;
                        deliveredAt?: string | undefined;
                        messageId?: string | undefined;
                    };
                    400: {} & {
                        error?: ({} & {
                            code?: string | undefined;
                            message?: string | undefined;
                            details?: Record<string, unknown> | undefined;
                        }) | undefined;
                    };
                    404: {} & {
                        error?: ({} & {
                            code?: string | undefined;
                            message?: string | undefined;
                            details?: Record<string, unknown> | undefined;
                        }) | undefined;
                    };
                    409: {} & {
                        error?: ({} & {
                            code?: string | undefined;
                            message?: string | undefined;
                            details?: Record<string, unknown> | undefined;
                        }) | undefined;
                    };
                    422: {} & {
                        error?: ({} & {
                            code?: string | undefined;
                            message?: string | undefined;
                            details?: Record<string, unknown> | undefined;
                        }) | undefined;
                    };
                };
            };
        };
    };
} & {
    automation: {
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
                        500: {} & {
                            error?: ({} & {
                                code?: string | undefined;
                                message?: string | undefined;
                                details?: Record<string, unknown> | undefined;
                            }) | undefined;
                        };
                        200: {} & {
                            error?: string | ({} & {
                                code?: string | undefined;
                                source?: string | undefined;
                                message?: string | undefined;
                                details?: Record<string, unknown> | undefined;
                            }) | null | undefined;
                            id?: string | undefined;
                            aborted?: boolean | undefined;
                            type?: "scrape" | "job_apply" | "email" | undefined;
                            output?: Record<string, unknown> | null | undefined;
                            input?: Record<string, unknown> | null | undefined;
                            progress?: number | null | undefined;
                            status?: "error" | "success" | "pending" | "running" | undefined;
                            updatedAt?: string | undefined;
                            createdAt?: string | undefined;
                            screenshots?: string[] | null | undefined;
                            totalSteps?: number | null | undefined;
                            jobId?: string | null | undefined;
                            userId?: string | null | undefined;
                            currentStep?: number | null | undefined;
                            startedAt?: string | null | undefined;
                            completedAt?: string | null | undefined;
                            exitCode?: number | null | undefined;
                            timedOut?: boolean | undefined;
                            executionMs?: number | null | undefined;
                        };
                        400: {} & {
                            error?: ({} & {
                                code?: string | undefined;
                                message?: string | undefined;
                                details?: Record<string, unknown> | undefined;
                            }) | undefined;
                        };
                        404: {} & {
                            error?: ({} & {
                                code?: string | undefined;
                                message?: string | undefined;
                                details?: Record<string, unknown> | undefined;
                            }) | undefined;
                        };
                        409: {} & {
                            error?: ({} & {
                                code?: string | undefined;
                                message?: string | undefined;
                                details?: Record<string, unknown> | undefined;
                            }) | undefined;
                        };
                        422: {} & {
                            error?: ({} & {
                                code?: string | undefined;
                                message?: string | undefined;
                                details?: Record<string, unknown> | undefined;
                            }) | undefined;
                        };
                    };
                };
            };
        };
    };
} & {
    automation: {
        scrape: {
            post: {
                body: {
                    target: "jobs_hitmarker" | "jobs_grackle" | "jobs_workwithindies" | "jobs_remotegamejobs" | "jobs_gamesjobsdirect" | "jobs_pocketgamer" | "studios";
                } & {};
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    500: {} & {
                        error?: ({} & {
                            code?: string | undefined;
                            message?: string | undefined;
                            details?: Record<string, unknown> | undefined;
                        }) | undefined;
                    };
                    200: {} & {
                        error?: string | ({} & {
                            code?: string | undefined;
                            source?: string | undefined;
                            message?: string | undefined;
                            details?: Record<string, unknown> | undefined;
                        }) | null | undefined;
                        id?: string | undefined;
                        aborted?: boolean | undefined;
                        type?: "scrape" | "job_apply" | "email" | undefined;
                        output?: Record<string, unknown> | null | undefined;
                        input?: Record<string, unknown> | null | undefined;
                        progress?: number | null | undefined;
                        status?: "error" | "success" | "pending" | "running" | undefined;
                        updatedAt?: string | undefined;
                        createdAt?: string | undefined;
                        screenshots?: string[] | null | undefined;
                        totalSteps?: number | null | undefined;
                        jobId?: string | null | undefined;
                        userId?: string | null | undefined;
                        currentStep?: number | null | undefined;
                        startedAt?: string | null | undefined;
                        completedAt?: string | null | undefined;
                        exitCode?: number | null | undefined;
                        timedOut?: boolean | undefined;
                        executionMs?: number | null | undefined;
                    };
                    400: {} & {
                        error?: ({} & {
                            code?: string | undefined;
                            message?: string | undefined;
                            details?: Record<string, unknown> | undefined;
                        }) | undefined;
                    };
                    404: {} & {
                        error?: ({} & {
                            code?: string | undefined;
                            message?: string | undefined;
                            details?: Record<string, unknown> | undefined;
                        }) | undefined;
                    };
                    409: {} & {
                        error?: ({} & {
                            code?: string | undefined;
                            message?: string | undefined;
                            details?: Record<string, unknown> | undefined;
                        }) | undefined;
                    };
                    422: {} & {
                        error?: ({} & {
                            code?: string | undefined;
                            message?: string | undefined;
                            details?: Record<string, unknown> | undefined;
                        }) | undefined;
                    };
                };
            };
        };
    };
} & {
    automation: {
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
                        500: {} & {
                            error?: ({} & {
                                code?: string | undefined;
                                message?: string | undefined;
                                details?: Record<string, unknown> | undefined;
                            }) | undefined;
                        };
                        200: {} & {
                            error?: string | ({} & {
                                code?: string | undefined;
                                source?: string | undefined;
                                message?: string | undefined;
                                details?: Record<string, unknown> | undefined;
                            }) | null | undefined;
                            id?: string | undefined;
                            aborted?: boolean | undefined;
                            type?: "scrape" | "job_apply" | "email" | undefined;
                            output?: Record<string, unknown> | null | undefined;
                            input?: Record<string, unknown> | null | undefined;
                            progress?: number | null | undefined;
                            status?: "error" | "success" | "pending" | "running" | undefined;
                            updatedAt?: string | undefined;
                            createdAt?: string | undefined;
                            screenshots?: string[] | null | undefined;
                            totalSteps?: number | null | undefined;
                            jobId?: string | null | undefined;
                            userId?: string | null | undefined;
                            currentStep?: number | null | undefined;
                            startedAt?: string | null | undefined;
                            completedAt?: string | null | undefined;
                            exitCode?: number | null | undefined;
                            timedOut?: boolean | undefined;
                            executionMs?: number | null | undefined;
                        };
                        400: {} & {
                            error?: ({} & {
                                code?: string | undefined;
                                message?: string | undefined;
                                details?: Record<string, unknown> | undefined;
                            }) | undefined;
                        };
                        404: {} & {
                            error?: ({} & {
                                code?: string | undefined;
                                message?: string | undefined;
                                details?: Record<string, unknown> | undefined;
                            }) | undefined;
                        };
                        409: {} & {
                            error?: ({} & {
                                code?: string | undefined;
                                message?: string | undefined;
                                details?: Record<string, unknown> | undefined;
                            }) | undefined;
                        };
                        422: {} & {
                            error?: ({} & {
                                code?: string | undefined;
                                message?: string | undefined;
                                details?: Record<string, unknown> | undefined;
                            }) | undefined;
                        };
                    };
                };
            };
        };
    };
} & {
    automation: {
        capabilities: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    500: {} & {
                        error?: ({} & {
                            code?: string | undefined;
                            message?: string | undefined;
                            details?: Record<string, unknown> | undefined;
                        }) | undefined;
                    };
                    200: {} & {
                        summary?: ({} & {
                            configured?: number | undefined;
                            manualRunAvailable?: number | undefined;
                            scheduledRunAvailable?: number | undefined;
                            runHistoryAvailable?: number | undefined;
                            liveUpdatesAvailable?: number | undefined;
                            total?: number | undefined;
                        }) | undefined;
                        capabilities?: ({} & {
                            name?: string | undefined;
                            id?: string | undefined;
                            category?: "scrape" | "job_apply" | undefined;
                            issues?: string[] | undefined;
                            target?: "jobs_hitmarker" | "jobs_grackle" | "jobs_workwithindies" | "jobs_remotegamejobs" | "jobs_gamesjobsdirect" | "jobs_pocketgamer" | "studios" | null | undefined;
                            enabled?: boolean | undefined;
                            configured?: boolean | undefined;
                            implemented?: boolean | undefined;
                            manualRunAvailable?: boolean | undefined;
                            scheduledRunAvailable?: boolean | undefined;
                            runHistoryAvailable?: boolean | undefined;
                            liveUpdatesAvailable?: boolean | undefined;
                        })[] | undefined;
                        generatedAt?: string | undefined;
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
    automation: {
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
                    200: ({} & {
                        error?: string | ({} & {
                            code?: string | undefined;
                            source?: string | undefined;
                            message?: string | undefined;
                            details?: Record<string, unknown> | undefined;
                        }) | null | undefined;
                        id?: string | undefined;
                        aborted?: boolean | undefined;
                        type?: "scrape" | "job_apply" | "email" | undefined;
                        output?: Record<string, unknown> | null | undefined;
                        input?: Record<string, unknown> | null | undefined;
                        progress?: number | null | undefined;
                        status?: "error" | "success" | "pending" | "running" | undefined;
                        updatedAt?: string | undefined;
                        createdAt?: string | undefined;
                        screenshots?: string[] | null | undefined;
                        totalSteps?: number | null | undefined;
                        jobId?: string | null | undefined;
                        userId?: string | null | undefined;
                        currentStep?: number | null | undefined;
                        startedAt?: string | null | undefined;
                        completedAt?: string | null | undefined;
                        exitCode?: number | null | undefined;
                        timedOut?: boolean | undefined;
                        executionMs?: number | null | undefined;
                    })[];
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
    automation: {
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
                        200: {} & {
                            error?: string | ({} & {
                                code?: string | undefined;
                                source?: string | undefined;
                                message?: string | undefined;
                                details?: Record<string, unknown> | undefined;
                            }) | null | undefined;
                            id?: string | undefined;
                            aborted?: boolean | undefined;
                            type?: "scrape" | "job_apply" | "email" | undefined;
                            output?: Record<string, unknown> | null | undefined;
                            input?: Record<string, unknown> | null | undefined;
                            progress?: number | null | undefined;
                            status?: "error" | "success" | "pending" | "running" | undefined;
                            updatedAt?: string | undefined;
                            createdAt?: string | undefined;
                            screenshots?: string[] | null | undefined;
                            totalSteps?: number | null | undefined;
                            jobId?: string | null | undefined;
                            userId?: string | null | undefined;
                            currentStep?: number | null | undefined;
                            startedAt?: string | null | undefined;
                            completedAt?: string | null | undefined;
                            exitCode?: number | null | undefined;
                            timedOut?: boolean | undefined;
                            executionMs?: number | null | undefined;
                        };
                        400: {} & {
                            error?: ({} & {
                                code?: string | undefined;
                                message?: string | undefined;
                                details?: Record<string, unknown> | undefined;
                            }) | undefined;
                        };
                        404: {} & {
                            error?: ({} & {
                                code?: string | undefined;
                                message?: string | undefined;
                                details?: Record<string, unknown> | undefined;
                            }) | undefined;
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
            error: import("@bao/shared").ErrorEnvelope;
        };
    };
}>;
