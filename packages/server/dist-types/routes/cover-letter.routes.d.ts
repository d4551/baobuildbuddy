import { Elysia } from "elysia";
export declare const coverLetterRoutes: Elysia<"/cover-letters", {
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
    "cover-letters": {
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
    "cover-letters": {
        post: {
            body: {
                company: string;
                position: string;
            } & {
                content?: Record<string, unknown> | undefined;
                template?: "creative" | "gaming" | "executive" | "technical" | "professional" | undefined;
                jobInfo?: Record<string, unknown> | undefined;
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
                    template: "creative" | "gaming" | "executive" | "technical" | "professional";
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
    "cover-letters": {
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
    "cover-letters": {
        ":id": {
            put: {
                body: {} & {
                    content?: Record<string, unknown> | undefined;
                    company?: string | undefined;
                    template?: "creative" | "gaming" | "executive" | "technical" | "professional" | undefined;
                    position?: string | undefined;
                    jobInfo?: Record<string, unknown> | undefined;
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
    "cover-letters": {
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
    "cover-letters": {
        generate: {
            post: {
                body: {
                    company: string;
                    position: string;
                } & {
                    resumeId?: string | undefined;
                    template?: "creative" | "gaming" | "executive" | "technical" | "professional" | undefined;
                    jobInfo?: Record<string, unknown> | undefined;
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
                        content: {
                            introduction: string;
                            body: string;
                            conclusion: string;
                        };
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
                            content: {
                                introduction: string;
                                body: string;
                                conclusion: string;
                            };
                            template: "creative" | "gaming" | "executive" | "technical" | "professional";
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
    "cover-letters": {
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
