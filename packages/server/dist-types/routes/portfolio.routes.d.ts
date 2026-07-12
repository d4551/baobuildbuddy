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
        projects: {
            post: {
                body: {
                    description: string;
                    title: string;
                } & {
                    engines?: string[] | undefined;
                    featured?: boolean | undefined;
                    githubUrl?: string | undefined;
                    image?: string | undefined;
                    liveUrl?: string | undefined;
                    platforms?: string[] | undefined;
                    role?: string | undefined;
                    sortOrder?: number | undefined;
                    tags?: string[] | undefined;
                    technologies?: string[] | undefined;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: import("@bao/shared/types/portfolio").PortfolioProject | {
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
} & {
    [x: string]: {
        projects: {
            ":id": {
                put: {
                    body: {} & {
                        description?: string | undefined;
                        engines?: string[] | undefined;
                        featured?: boolean | undefined;
                        githubUrl?: string | undefined;
                        image?: string | undefined;
                        liveUrl?: string | undefined;
                        platforms?: string[] | undefined;
                        role?: string | undefined;
                        sortOrder?: number | undefined;
                        tags?: string[] | undefined;
                        technologies?: string[] | undefined;
                        title?: string | undefined;
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
                            success?: undefined;
                            id?: undefined;
                            error: string;
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
