import type { RouteSetState } from "../types/route-state";
import { type CoverLetterExportBody, type CoverLetterIdParams } from "./cover-letter-route-contracts";
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
                    jobInfo: Record<string, unknown> | null;
                    content: Record<string, unknown> | null;
                    template: string | null;
                    createdAt: string;
                    updatedAt: string;
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
                    jobInfo: Record<string, unknown>;
                    content: Record<string, unknown>;
                    template: "creative" | "executive" | "gaming" | "professional" | "technical";
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
                        jobInfo: Record<string, unknown> | null;
                        content: Record<string, unknown> | null;
                        template: string | null;
                        createdAt: string;
                        updatedAt: string;
                    } | {
                        error: string;
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
                        jobInfo: Record<string, unknown> | null;
                        content: Record<string, unknown> | null;
                        template: string | null;
                        createdAt: string;
                        updatedAt: string;
                    } | {
                        error: string;
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
                        error: string;
                        success?: undefined;
                        id?: undefined;
                    } | {
                        error?: undefined;
                        success: boolean;
                        id: string;
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
                        message?: undefined;
                        content?: undefined;
                        error: string;
                        details?: undefined;
                        coverLetter?: undefined;
                    } | {
                        message?: undefined;
                        content?: undefined;
                        error: string;
                        details: string;
                        coverLetter?: undefined;
                    } | {
                        error?: undefined;
                        details?: undefined;
                        message: string;
                        content: import("./cover-letter-route-generation-support").GeneratedCoverLetterContent;
                        coverLetter?: undefined;
                    } | {
                        error?: undefined;
                        content?: undefined;
                        details?: undefined;
                        message: string;
                        coverLetter: {
                            id: string;
                            company: string;
                            position: string;
                            jobInfo: Record<string, unknown>;
                            content: import("./cover-letter-route-generation-support").GeneratedCoverLetterContent;
                            template: "creative" | "executive" | "gaming" | "professional" | "technical";
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
                };
                error: never;
            };
        };
    };
}, import("elysia/types").DefaultEphemeral, import("elysia/types").DefaultEphemeral, "post", "/:id/export", import("elysia/types").IntersectIfObjectSchema<import("elysia").UnwrapRoute<{
    detail: {
        tags: string[];
    };
    params: import("typebox").TObject<{
        id: import("typebox").TString;
    }>;
    body: import("typebox").TObject<{
        format: import("typebox").TOptional<import("typebox").TString>;
    }>;
}, {}, `${string}/:id/export`>, import("elysia/types").MergeScopedSchemas<{}, {}, {}>>, {}, ({ params, body, set, }: {
    params: CoverLetterIdParams;
    body: CoverLetterExportBody;
    set: RouteSetState;
}) => Promise<Response | {
    error: string;
    details: string;
} | {
    error: string;
}>>;
