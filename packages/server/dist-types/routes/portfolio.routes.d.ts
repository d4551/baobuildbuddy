import { Elysia } from "elysia";
export declare const portfolioRoutes: Elysia<string, {
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
                200: import("@bao/shared/types/portfolio").PortfolioData;
            };
        };
    };
} & {
    [x: string]: {
        put: {
            body: {
                metadata: Record<string, unknown>;
            } & {};
            params: {};
            query: unknown;
            headers: unknown;
            response: {
                200: import("@bao/shared/types/portfolio").PortfolioData;
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
        projects: {
            post: {
                body: {
                    title: string;
                    description: string;
                } & {
                    role?: string | undefined;
                    sortOrder?: number | undefined;
                    technologies?: string[] | undefined;
                    platforms?: string[] | undefined;
                    tags?: string[] | undefined;
                    image?: string | undefined;
                    liveUrl?: string | undefined;
                    githubUrl?: string | undefined;
                    featured?: boolean | undefined;
                    engines?: string[] | undefined;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: import("@bao/shared/types/portfolio").PortfolioProject | {
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
        projects: {
            reorder: {
                post: {
                    body: {
                        orderedIds: string[];
                    } & {};
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: import("@bao/shared/types/portfolio").PortfolioData | {
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
} & {
    [x: string]: {
        projects: {
            ":id": {
                put: {
                    body: {} & {
                        role?: string | undefined;
                        sortOrder?: number | undefined;
                        title?: string | undefined;
                        description?: string | undefined;
                        technologies?: string[] | undefined;
                        platforms?: string[] | undefined;
                        tags?: string[] | undefined;
                        image?: string | undefined;
                        liveUrl?: string | undefined;
                        githubUrl?: string | undefined;
                        featured?: boolean | undefined;
                        engines?: string[] | undefined;
                    };
                    params: {
                        id: string;
                    } & {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: import("@bao/shared/types/portfolio").PortfolioProject | {
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
} & {
    [x: string]: {
        projects: {
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
    };
} & {
    [x: string]: {
        export: {
            post: {
                body: {} & {
                    format?: string | undefined;
                };
                params: {};
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
