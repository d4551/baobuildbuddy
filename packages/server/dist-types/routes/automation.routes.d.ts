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
        "job-apply": {
            post: {
                body: {
                    customAnswers?: {} | undefined;
                    jobId?: string | undefined;
                    coverLetterId?: string | undefined;
                    resumeId: string;
                    jobUrl: string;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    500: {
                        error: {
                            details?: {} | undefined;
                            message: string;
                            code: string;
                        };
                    };
                    200: {
                        id: string;
                        aborted: boolean;
                        error: string | {
                            details?: {} | undefined;
                            source: string;
                            message: string;
                            code: string;
                        } | null;
                        type: "scrape" | "job_apply" | "email";
                        output: {
                            [x: string]: unknown;
                        } | null;
                        input: {
                            [x: string]: unknown;
                        } | null;
                        progress: number | null;
                        status: "success" | "pending" | "running" | "error";
                        createdAt: string;
                        updatedAt: string;
                        screenshots: string[] | null;
                        totalSteps: number | null;
                        jobId: string | null;
                        userId: string | null;
                        currentStep: number | null;
                        startedAt: string | null;
                        completedAt: string | null;
                        exitCode: number | null;
                        timedOut: boolean;
                        executionMs: number | null;
                    };
                    400: {
                        error: {
                            details?: {} | undefined;
                            message: string;
                            code: string;
                        };
                    };
                    404: {
                        error: {
                            details?: {} | undefined;
                            message: string;
                            code: string;
                        };
                    };
                    409: {
                        error: {
                            details?: {} | undefined;
                            message: string;
                            code: string;
                        };
                    };
                    422: {
                        error: {
                            details?: {} | undefined;
                            message: string;
                            code: string;
                        };
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
                        customAnswers?: {} | undefined;
                        jobId?: string | undefined;
                        coverLetterId?: string | undefined;
                        resumeId: string;
                        jobUrl: string;
                        runAt: string;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        500: {
                            error: {
                                details?: {} | undefined;
                                message: string;
                                code: string;
                            };
                        };
                        200: {
                            id: string;
                            aborted: boolean;
                            error: string | {
                                details?: {} | undefined;
                                source: string;
                                message: string;
                                code: string;
                            } | null;
                            type: "scrape" | "job_apply" | "email";
                            output: {
                                [x: string]: unknown;
                            } | null;
                            input: {
                                [x: string]: unknown;
                            } | null;
                            progress: number | null;
                            status: "success" | "pending" | "running" | "error";
                            createdAt: string;
                            updatedAt: string;
                            screenshots: string[] | null;
                            totalSteps: number | null;
                            jobId: string | null;
                            userId: string | null;
                            currentStep: number | null;
                            startedAt: string | null;
                            completedAt: string | null;
                            exitCode: number | null;
                            timedOut: boolean;
                            executionMs: number | null;
                        };
                        400: {
                            error: {
                                details?: {} | undefined;
                                message: string;
                                code: string;
                            };
                        };
                        404: {
                            error: {
                                details?: {} | undefined;
                                message: string;
                                code: string;
                            };
                        };
                        409: {
                            error: {
                                details?: {} | undefined;
                                message: string;
                                code: string;
                            };
                        };
                        422: {
                            error: {
                                details?: {} | undefined;
                                message: string;
                                code: string;
                            };
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
                    sender?: string | undefined;
                    tone?: "professional" | "friendly" | "concise" | undefined;
                    recipientEmail?: string | undefined;
                    deliverAfterGeneration?: boolean | undefined;
                    message: string;
                    subject: string;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    500: {
                        error: {
                            details?: {} | undefined;
                            message: string;
                            code: string;
                        };
                    };
                    200: {
                        recipientEmail?: string | undefined;
                        deliveredAt?: string | undefined;
                        messageId?: string | undefined;
                        provider: string;
                        model: string;
                        runId: string;
                        status: "success";
                        reply: string;
                        delivered: boolean;
                    };
                    400: {
                        error: {
                            details?: {} | undefined;
                            message: string;
                            code: string;
                        };
                    };
                    404: {
                        error: {
                            details?: {} | undefined;
                            message: string;
                            code: string;
                        };
                    };
                    409: {
                        error: {
                            details?: {} | undefined;
                            message: string;
                            code: string;
                        };
                    };
                    422: {
                        error: {
                            details?: {} | undefined;
                            message: string;
                            code: string;
                        };
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
                query: {
                    type?: "scrape" | "job_apply" | "email" | undefined;
                    status?: "success" | "pending" | "running" | "error" | undefined;
                };
                headers: unknown;
                response: {
                    200: {
                        id: string;
                        aborted: boolean;
                        error: string | {
                            details?: {} | undefined;
                            source: string;
                            message: string;
                            code: string;
                        } | null;
                        type: "scrape" | "job_apply" | "email";
                        output: {
                            [x: string]: unknown;
                        } | null;
                        input: {
                            [x: string]: unknown;
                        } | null;
                        progress: number | null;
                        status: "success" | "pending" | "running" | "error";
                        createdAt: string;
                        updatedAt: string;
                        screenshots: string[] | null;
                        totalSteps: number | null;
                        jobId: string | null;
                        userId: string | null;
                        currentStep: number | null;
                        startedAt: string | null;
                        completedAt: string | null;
                        exitCode: number | null;
                        timedOut: boolean;
                        executionMs: number | null;
                    }[];
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
                    };
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            id: string;
                            aborted: boolean;
                            error: string | {
                                details?: {} | undefined;
                                source: string;
                                message: string;
                                code: string;
                            } | null;
                            type: "scrape" | "job_apply" | "email";
                            output: {
                                [x: string]: unknown;
                            } | null;
                            input: {
                                [x: string]: unknown;
                            } | null;
                            progress: number | null;
                            status: "success" | "pending" | "running" | "error";
                            createdAt: string;
                            updatedAt: string;
                            screenshots: string[] | null;
                            totalSteps: number | null;
                            jobId: string | null;
                            userId: string | null;
                            currentStep: number | null;
                            startedAt: string | null;
                            completedAt: string | null;
                            exitCode: number | null;
                            timedOut: boolean;
                            executionMs: number | null;
                        };
                        400: {
                            error: {
                                details?: {} | undefined;
                                message: string;
                                code: string;
                            };
                        };
                        404: {
                            error: {
                                details?: {} | undefined;
                                message: string;
                                code: string;
                            };
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
    response: {};
} & {
    derive: {};
    resolve: {};
    schema: {};
}>;
