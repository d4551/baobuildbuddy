import { Elysia } from "elysia";
export declare const coverLetterRoutes: Elysia<string, {
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
        };
    };
} & {
    [x: string]: {
        post: {
            body: {
                company: string;
                position: string;
            } & {
                content?: Record<string, unknown> | undefined;
                jobInfo?: Record<string, unknown> | undefined;
                template?: "professional" | "creative" | "gaming" | "executive" | "technical" | undefined;
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
                    template: "professional" | "creative" | "gaming" | "executive" | "technical";
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
} & {
    [x: string]: {
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
        ":id": {
            put: {
                body: {} & {
                    content?: Record<string, unknown> | undefined;
                    company?: string | undefined;
                    position?: string | undefined;
                    jobInfo?: Record<string, unknown> | undefined;
                    template?: "professional" | "creative" | "gaming" | "executive" | "technical" | undefined;
                };
                params: {
                    id: string;
                } & {};
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
        ":id": {
            delete: {
                body: unknown;
                params: {
                    id: string;
                } & {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        error: string;
                        success?: undefined;
                        id?: undefined;
                    } | {
                        success: boolean;
                        id: string;
                        error?: undefined;
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
    [x: string]: {
        [x: string]: {
            post: {
                body: {
                    company: string;
                    position: string;
                } & {
                    resumeId?: string | undefined;
                    jobInfo?: Record<string, unknown> | undefined;
                    template?: "professional" | "creative" | "gaming" | "executive" | "technical" | undefined;
                    save?: boolean | undefined;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        error: string;
                        details?: undefined;
                        message?: undefined;
                        content?: undefined;
                        coverLetter?: undefined;
                    } | {
                        error: string;
                        details: string;
                        message?: undefined;
                        content?: undefined;
                        coverLetter?: undefined;
                    } | {
                        message: string;
                        content: import("./cover-letter-route-generation-support").GeneratedCoverLetterContent;
                        error?: undefined;
                        details?: undefined;
                        coverLetter?: undefined;
                    } | {
                        message: string;
                        coverLetter: {
                            id: string;
                            company: string;
                            position: string;
                            jobInfo: Record<string, unknown>;
                            content: import("./cover-letter-route-generation-support").GeneratedCoverLetterContent;
                            template: "professional" | "creative" | "gaming" | "executive" | "technical";
                        };
                        error?: undefined;
                        details?: undefined;
                        content?: undefined;
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
    [x: string]: {
        ":id": {
            export: {
                post: {
                    body: {} & {
                        format?: string | undefined;
                    };
                    params: {
                        id: string;
                    } & {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: Response | {
                            error: string;
                            details: string;
                        } | {
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
