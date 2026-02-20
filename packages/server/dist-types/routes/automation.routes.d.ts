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
}, {
    schema: {};
    standaloneSchema: {};
    macro: {};
    macroFn: {};
    parser: {};
    response: {};
}, {
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
                        status: "running";
                        runId: string;
                    };
                    500: {
                        error: string;
                    };
                    400: {
                        error: string;
                    };
                    404: {
                        error: string;
                    };
                    409: {
                        error: string;
                    };
                    422: {
                        error: string;
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
                    type?: "email" | "job_apply" | "scrape" | undefined;
                    status?: "pending" | "success" | "error" | "running" | undefined;
                };
                headers: unknown;
                response: {
                    200: {
                        progress: number | null;
                        type: "email" | "job_apply" | "scrape";
                        error: string | null;
                        output: any;
                        input: {
                            [x: string]: any;
                        } | null;
                        id: string;
                        createdAt: string;
                        updatedAt: string;
                        screenshots: string[] | null;
                        jobId: string | null;
                        status: "pending" | "success" | "error" | "running";
                        userId: string | null;
                        currentStep: number | null;
                        totalSteps: number | null;
                        startedAt: string | null;
                        completedAt: string | null;
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
                            type: "email" | "job_apply" | "scrape";
                            error: string | null;
                            output: any;
                            input: {
                                [x: string]: any;
                            } | null;
                            id: string;
                            createdAt: string;
                            updatedAt: string;
                            screenshots: string[] | null;
                            jobId: string | null;
                            status: "pending" | "success" | "error" | "running";
                            userId: string | null;
                            currentStep: number | null;
                            totalSteps: number | null;
                            startedAt: string | null;
                            completedAt: string | null;
                        };
                        400: {
                            error: string;
                        };
                        404: {
                            error: string;
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
}, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
    response: {};
}>;
