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
                template?: "creative" | "executive" | "gaming" | "professional" | "technical" | undefined;
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
        ":id": {
            put: {
                body: {} & {
                    company?: string | undefined;
                    content?: Record<string, unknown> | undefined;
                    jobInfo?: Record<string, unknown> | undefined;
                    position?: string | undefined;
                    template?: "creative" | "executive" | "gaming" | "professional" | "technical" | undefined;
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
                        error?: undefined;
                        success: boolean;
                        id: string;
                    };
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
        [x: string]: {
            post: {
                body: {
                    company: string;
                    position: string;
                } & {
                    jobInfo?: Record<string, unknown> | undefined;
                    resumeId?: string | undefined;
                    save?: boolean | undefined;
                    template?: "creative" | "executive" | "gaming" | "professional" | "technical" | undefined;
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
}, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
    response: {};
}>;
