import { Elysia } from "elysia";
/**
 * Serves automation run screenshots from managed run directories.
 */
export declare const automationScreenshotRoutes: Elysia<string, {
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
        ":runId": {
            ":index": {
                get: {
                    body: unknown;
                    params: {
                        index: string;
                        runId: string;
                    } & {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: unknown;
                        400: {
                            error: string;
                        } & {};
                        404: {
                            error: string;
                        } & {};
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
