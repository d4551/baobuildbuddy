import { Elysia } from "elysia";
export declare const errorHandler: Elysia<"", {
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
}, {}, {
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
    response: {
        200: {
            error: string;
            code: "NOT_FOUND";
            fields?: undefined;
        } | {
            error: string;
            code: "VALIDATION";
            fields: unknown[] | undefined;
        } | {
            error: string;
            code: number | "UNKNOWN" | "PARSE" | "INTERNAL_SERVER_ERROR" | "INVALID_COOKIE_SIGNATURE" | "INVALID_FILE_TYPE";
            fields?: undefined;
        };
    };
}>;
