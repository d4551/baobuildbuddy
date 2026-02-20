import { Elysia } from "elysia";
export declare const scraperRoutes: Elysia<"/scraper", {
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
    scraper: {
        studios: {
            post: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        scraped: number;
                        upserted: number;
                        errors: string[];
                    } | {
                        error: string;
                        details: string;
                    };
                };
            };
        };
    };
} & {
    scraper: {
        jobs: {
            gamedev: {
                post: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            scraped: number;
                            upserted: number;
                            errors: string[];
                        } | {
                            error: string;
                            details: string;
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
