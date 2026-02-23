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
                    jobId?: string | undefined;
                    customAnswers?: {} | undefined;
                    coverLetterId?: string | undefined;
                    resumeId: string;
                    jobUrl: string;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        progress: number | null;
                        error: string | {
                            details?: {} | undefined;
                            message: string;
                            code: string;
                        } | null;
                        type: "email" | "scrape" | "job_apply";
                        output: {
                            [x: string]: unknown;
                        } | null;
                        input: {
                            [x: string]: unknown;
                        } | null;
                        id: string;
                        aborted: boolean;
                        createdAt: string;
                        updatedAt: string;
                        status: "success" | "error" | "pending" | "running";
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
                    500: {
                        error: {
                            details?: {} | undefined;
                            message: string;
                            code: string;
                        };
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
                        jobId?: string | undefined;
                        customAnswers?: {} | undefined;
                        coverLetterId?: string | undefined;
                        resumeId: string;
                        jobUrl: string;
                        runAt: string;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            progress: number | null;
                            error: string | {
                                details?: {} | undefined;
                                message: string;
                                code: string;
                            } | null;
                            type: "email" | "scrape" | "job_apply";
                            output: {
                                [x: string]: unknown;
                            } | null;
                            input: {
                                [x: string]: unknown;
                            } | null;
                            id: string;
                            aborted: boolean;
                            createdAt: string;
                            updatedAt: string;
                            status: "success" | "error" | "pending" | "running";
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
                        500: {
                            error: {
                                details?: {} | undefined;
                                message: string;
                                code: string;
                            };
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
                    message: string;
                    subject: string;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        provider: string;
                        model: string;
                        status: "success";
                        runId: string;
                        reply: string;
                    };
                    500: {
                        error: {
                            details?: {} | undefined;
                            message: string;
                            code: string;
                        };
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
                    type?: "email" | "scrape" | "job_apply" | undefined;
                    status?: "success" | "error" | "pending" | "running" | undefined;
                };
                headers: unknown;
                response: {
                    200: {
                        progress: number | null;
                        error: string | {
                            details?: {} | undefined;
                            message: string;
                            code: string;
                        } | null;
                        type: "email" | "scrape" | "job_apply";
                        output: {
                            [x: string]: unknown;
                        } | null;
                        input: {
                            [x: string]: unknown;
                        } | null;
                        id: string;
                        aborted: boolean;
                        createdAt: string;
                        updatedAt: string;
                        status: "success" | "error" | "pending" | "running";
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
                            progress: number | null;
                            error: string | {
                                details?: {} | undefined;
                                message: string;
                                code: string;
                            } | null;
                            type: "email" | "scrape" | "job_apply";
                            output: {
                                [x: string]: unknown;
                            } | null;
                            input: {
                                [x: string]: unknown;
                            } | null;
                            id: string;
                            aborted: boolean;
                            createdAt: string;
                            updatedAt: string;
                            status: "success" | "error" | "pending" | "running";
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
