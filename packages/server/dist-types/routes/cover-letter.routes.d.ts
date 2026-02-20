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
                template?: string | undefined;
                jobInfo?: {} | undefined;
                content?: {} | undefined;
                company: string;
                position: string;
            };
            params: {};
            query: unknown;
            headers: unknown;
            response: {
                200: {
                    id: string;
                    company: string;
                    position: string;
                    jobInfo: {};
                    content: {};
                    template: string;
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
                body: {
                    company?: string | undefined;
                    template?: string | undefined;
                    position?: string | undefined;
                    jobInfo?: {} | undefined;
                    content?: {} | undefined;
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
                };
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
                    resumeId?: string | undefined;
                    template?: string | undefined;
                    jobInfo?: {} | undefined;
                    save?: boolean | undefined;
                    company: string;
                    position: string;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        error: string;
                        details: string;
                        message?: undefined;
                        coverLetter?: undefined;
                        content?: undefined;
                    } | {
                        message: string;
                        coverLetter: {
                            id: string;
                            company: string;
                            position: string;
                            jobInfo: {};
                            content: {
                                introduction: string;
                                body: string;
                                conclusion: string;
                            };
                            template: string;
                        };
                        error?: undefined;
                        details?: undefined;
                        content?: undefined;
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
                    body: unknown;
                    params: {
                        id: string;
                    };
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: Response | {
                            error: string;
                            details?: undefined;
                        } | {
                            error: string;
                            details: string;
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
