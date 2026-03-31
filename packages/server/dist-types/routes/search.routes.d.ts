import { Elysia } from "elysia";
export declare const searchRoutes: Elysia<string, {
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
        [x: string]: {
            get: {
                body: unknown;
                params: {};
                query: {} & {
                    types?: string | ("skills" | "studios" | "jobs" | "resumes")[] | undefined;
                    q?: string | undefined;
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
    };
} & {
    [x: string]: {
        [x: string]: {
            get: {
                body: unknown;
                params: {};
                query: {} & {
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
