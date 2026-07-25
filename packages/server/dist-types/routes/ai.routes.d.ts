import { type status } from "elysia";
import { type AutomationActionRouteBody } from "./ai-route-contracts";
type RouteStatus = typeof status;
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
                    200: unknown;
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
                    200: unknown;
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
        readonly 200: import("typebox").TUnknown;
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
    body: AutomationActionRouteBody;
    status: RouteStatus;
}) => Promise<import("elysia").ElysiaStatus<200 | 400 | 404 | 409 | 422 | 500, {
    error: string;
} | {
    error: string;
} | {
    runId: string;
    status: string;
    message: string;
}, 200 | 400 | 404 | 409 | 422 | 500>>>;
export {};
