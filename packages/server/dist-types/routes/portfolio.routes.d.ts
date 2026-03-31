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
                metadata: Record<string, unknown>;
            } & {};
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
                    title: string;
                    description: string;
                } & {
                    role?: string | undefined;
                    technologies?: string[] | undefined;
                    platforms?: string[] | undefined;
                    featured?: boolean | undefined;
                    sortOrder?: number | undefined;
                    image?: string | undefined;
                    liveUrl?: string | undefined;
                    githubUrl?: string | undefined;
                    tags?: string[] | undefined;
                    engines?: string[] | undefined;
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
                    } & {};
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
                    body: {} & {
                        role?: string | undefined;
                        title?: string | undefined;
                        description?: string | undefined;
                        technologies?: string[] | undefined;
                        platforms?: string[] | undefined;
                        featured?: boolean | undefined;
                        sortOrder?: number | undefined;
                        image?: string | undefined;
                        liveUrl?: string | undefined;
                        githubUrl?: string | undefined;
                        tags?: string[] | undefined;
                        engines?: string[] | undefined;
                    };
                    params: {
                        id: string;
                    } & {};
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
    portfolio: {
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
