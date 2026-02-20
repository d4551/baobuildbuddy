import { Elysia } from "elysia";
export declare const searchRoutes: Elysia<"/search", {
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
    search: {
        get: {
            body: unknown;
            params: {};
            query: {
                q?: string | undefined;
                types?: string | undefined;
            };
            headers: unknown;
            response: {
                200: import("../services/search-service").UnifiedSearchResult;
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
    search: {
        autocomplete: {
            get: {
                body: unknown;
                params: {};
                query: {
                    prefix?: string | undefined;
                };
                headers: unknown;
                response: {
                    200: {
                        text: string;
                        type: string;
                    }[];
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
