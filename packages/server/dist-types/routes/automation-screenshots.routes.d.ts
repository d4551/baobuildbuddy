import { Elysia } from "elysia";
/**
 * Serves automation run screenshots from managed run directories.
 */
export declare const automationScreenshotRoutes: Elysia<"/automation/screenshots", {
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
    automation: {
        screenshots: {
            ":runId": {
                ":index": {
                    get: {
                        body: unknown;
                        params: {
                            runId: string;
                            index: string;
                        };
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: any;
                            400: {
                                error: string;
                            };
                            404: {
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
