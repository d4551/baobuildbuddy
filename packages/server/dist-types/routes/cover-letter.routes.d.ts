import { type status } from "elysia";
import { type CoverLetterExportBody, type CoverLetterIdParams } from "./cover-letter-route-contracts";
type RouteStatus = typeof status;
export declare const coverLetterRoutes: import("elysia/types").AddRoute<string, "local", import("elysia/types").DefaultSingleton, {
    typebox: {};
    error: [];
}, import("elysia/types").DefaultMetadata, {
    [x: string]: {
        get: {
            body: unknown;
            params: {};
            query: unknown;
            headers: unknown;
            response: {
                200: {
                    id: string;
                    company: string;
                    position: string;
                    jobInfo?: Record<string, unknown> | null | undefined;
                    content?: Record<string, unknown> | null | undefined;
                    template?: string | null | undefined;
                    createdAt?: string | undefined;
                    updatedAt?: string | undefined;
                }[];
            };
            error: never;
        };
    };
} & {
    [x: string]: {
        post: {
            body: {
                company: string;
                position: string;
                jobInfo?: Record<string, unknown> | undefined;
                content?: Record<string, unknown> | undefined;
                template?: undefined;
            };
            params: {};
            query: unknown;
            headers: unknown;
            response: {
                200: {
                    id: string;
                    company: string;
                    position: string;
                    jobInfo?: Record<string, unknown> | null | undefined;
                    content?: Record<string, unknown> | null | undefined;
                    template?: string | null | undefined;
                    createdAt?: string | undefined;
                    updatedAt?: string | undefined;
                };
                201: {
                    id: string;
                    company: string;
                    position: string;
                    jobInfo?: Record<string, unknown> | null | undefined;
                    content?: Record<string, unknown> | null | undefined;
                    template?: string | null | undefined;
                    createdAt?: string | undefined;
                    updatedAt?: string | undefined;
                };
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
            };
            error: never;
        };
    };
} & {
    [x: string]: {
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
                        company: string;
                        position: string;
                        jobInfo?: Record<string, unknown> | null | undefined;
                        content?: Record<string, unknown> | null | undefined;
                        template?: string | null | undefined;
                        createdAt?: string | undefined;
                        updatedAt?: string | undefined;
                    };
                    201: {
                        id: string;
                        company: string;
                        position: string;
                        jobInfo?: Record<string, unknown> | null | undefined;
                        content?: Record<string, unknown> | null | undefined;
                        template?: string | null | undefined;
                        createdAt?: string | undefined;
                        updatedAt?: string | undefined;
                    };
                    404: {
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
        ":id": {
            put: {
                body: {
                    company?: string | undefined;
                    position?: string | undefined;
                    jobInfo?: Record<string, unknown> | undefined;
                    content?: Record<string, unknown> | undefined;
                    template?: undefined;
                };
                params: {
                    id: string;
                };
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        id: string;
                        company: string;
                        position: string;
                        jobInfo?: Record<string, unknown> | null | undefined;
                        content?: Record<string, unknown> | null | undefined;
                        template?: string | null | undefined;
                        createdAt?: string | undefined;
                        updatedAt?: string | undefined;
                    };
                    201: {
                        id: string;
                        company: string;
                        position: string;
                        jobInfo?: Record<string, unknown> | null | undefined;
                        content?: Record<string, unknown> | null | undefined;
                        template?: string | null | undefined;
                        createdAt?: string | undefined;
                        updatedAt?: string | undefined;
                    };
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
                };
                error: never;
            };
        };
    };
} & {
    [x: string]: {
        ":id": {
            delete: {
                body: unknown;
                params: {
                    id: string;
                };
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        success: boolean;
                        id: string;
                    };
                    404: {
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
        [x: string]: {
            post: {
                body: {
                    company: string;
                    position: string;
                    jobInfo?: Record<string, unknown> | undefined;
                    resumeId?: string | undefined;
                    template?: undefined;
                    save?: boolean | undefined;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        message: string;
                        content: {
                            introduction: string;
                            body: string;
                            conclusion: string;
                        };
                    };
                    201: {
                        message: string;
                        coverLetter: {
                            id: string;
                            company: string;
                            position: string;
                            jobInfo?: Record<string, unknown> | null | undefined;
                            content?: Record<string, unknown> | null | undefined;
                            template?: string | null | undefined;
                            createdAt?: string | undefined;
                            updatedAt?: string | undefined;
                        };
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
                    500: {
                        error: string;
                        code?: string | undefined;
                        details?: string | undefined;
                        fields?: string[] | undefined;
                        id?: string | undefined;
                    };
                    503: {
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
}, import("elysia/types").DefaultEphemeral, import("elysia/types").DefaultEphemeral, "post", "/:id/export", import("elysia/types").IntersectIfObjectSchema<import("elysia").UnwrapRoute<{
    detail: {
        tags: string[];
        description: string;
    };
    params: import("typebox").TObject<{
        id: import("typebox").TString;
    }>;
    body: import("typebox").TObject<{
        format: import("typebox").TOptional<import("typebox").TString>;
        template: import("typebox").TOptional<import("typebox").TUnion<import("typebox").TLiteral<"creative" | "executive" | "gaming" | "professional" | "technical">[]>>;
    }>;
    response: {
        200: import("typebox").TUnknown;
        404: import("typebox").TObject<{
            error: import("typebox").TString;
            code: import("typebox").TOptional<import("typebox").TString>;
            details: import("typebox").TOptional<import("typebox").TString>;
            fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            id: import("typebox").TOptional<import("typebox").TString>;
        }>;
        500: import("typebox").TObject<{
            error: import("typebox").TString;
            code: import("typebox").TOptional<import("typebox").TString>;
            details: import("typebox").TOptional<import("typebox").TString>;
            fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            id: import("typebox").TOptional<import("typebox").TString>;
        }>;
    };
}, {}, `${string}/:id/export`>, import("elysia/types").MergeScopedSchemas<{}, {}, {}>>, {}, ({ params, body, status, }: {
    params: CoverLetterIdParams;
    body: CoverLetterExportBody;
    status: RouteStatus;
}) => Promise<import("elysia").ElysiaStatus<200, Response | {
    error: string;
}, 200> | import("elysia").ElysiaStatus<404, {
    error: string;
    details: string;
} | {
    details?: undefined;
    error: string;
}, 404> | import("elysia").ElysiaStatus<500, {
    error: string;
    details: string;
} | {
    details?: undefined;
    error: string;
}, 500>>>;
export {};
