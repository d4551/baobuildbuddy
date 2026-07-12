import { Elysia } from "elysia";
export declare const scraperRoutes: Elysia<string, {
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
            post: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: import("@bao/shared/types/jobs").ScraperOperationResult | {
                        error: string;
                        details: string;
                    };
                };
            };
        };
    };
} & {
    [x: string]: {
        [x: string]: {
            post: {
                body: unknown;
                params: {
                    portalId: string;
                } & {};
                query: unknown;
                headers: unknown;
                response: {
                    200: import("@bao/shared/types/jobs").ScraperOperationResult | {
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
