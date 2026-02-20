import { Elysia } from "elysia";
export declare const portfolioRoutes: Elysia<"/portfolio", {
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
    portfolio: {
        get: {
            body: unknown;
            params: {};
            query: unknown;
            headers: unknown;
            response: {
                200: import("@bao/shared").PortfolioData;
            };
        };
    };
} & {
    portfolio: {
        put: {
            body: {
                metadata: {
                    [x: string]: unknown;
                };
            };
            params: {};
            query: unknown;
            headers: unknown;
            response: {
                200: import("@bao/shared").PortfolioData;
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
    portfolio: {
        projects: {
            post: {
                body: {
                    image?: string | undefined;
                    platforms?: string[] | undefined;
                    role?: string | undefined;
                    technologies?: string[] | undefined;
                    liveUrl?: string | undefined;
                    githubUrl?: string | undefined;
                    tags?: string[] | undefined;
                    featured?: boolean | undefined;
                    engines?: string[] | undefined;
                    sortOrder?: number | undefined;
                    title: string;
                    description: string;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: import("@bao/shared").PortfolioProject | {
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
    portfolio: {
        projects: {
            reorder: {
                post: {
                    body: {
                        orderedIds: string[];
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: import("@bao/shared").PortfolioData | {
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
    portfolio: {
        projects: {
            ":id": {
                put: {
                    body: {
                        image?: string | undefined;
                        platforms?: string[] | undefined;
                        role?: string | undefined;
                        title?: string | undefined;
                        description?: string | undefined;
                        technologies?: string[] | undefined;
                        liveUrl?: string | undefined;
                        githubUrl?: string | undefined;
                        tags?: string[] | undefined;
                        featured?: boolean | undefined;
                        engines?: string[] | undefined;
                        sortOrder?: number | undefined;
                    };
                    params: {
                        id: string;
                    };
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: import("@bao/shared").PortfolioProject | {
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
    portfolio: {
        projects: {
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
    };
} & {
    portfolio: {
        export: {
            post: {
                body: {
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
