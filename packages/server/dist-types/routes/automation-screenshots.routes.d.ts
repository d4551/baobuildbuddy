import { type status } from "elysia";
import { type AutomationScreenshotParams } from "./automation-screenshot-route-contracts";
type RouteStatus = typeof status;
/**
 * Serves automation run screenshots from managed run directories.
 */
export declare const automationScreenshotRoutes: import("elysia/types").AddRoute<string, "local", import("elysia/types").DefaultSingleton, {
    typebox: {};
    error: [];
}, import("elysia/types").DefaultMetadata, {}, import("elysia/types").DefaultEphemeral, import("elysia/types").DefaultEphemeral, "get", "/:runId/:index", import("elysia/types").IntersectIfObjectSchema<import("elysia").UnwrapRoute<{
    detail: {
        tags: string[];
        description: string;
    };
    params: import("typebox").TObject<{
        runId: import("typebox").TString;
        index: import("typebox").TString;
    }>;
    response: {
        readonly 200: import("typebox").TUnknown;
        readonly 400: import("typebox").TObject<{
            error: import("typebox").TString;
            code: import("typebox").TOptional<import("typebox").TString>;
            details: import("typebox").TOptional<import("typebox").TString>;
            fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            id: import("typebox").TOptional<import("typebox").TString>;
        }>;
        readonly 404: import("typebox").TObject<{
            error: import("typebox").TString;
            code: import("typebox").TOptional<import("typebox").TString>;
            details: import("typebox").TOptional<import("typebox").TString>;
            fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            id: import("typebox").TOptional<import("typebox").TString>;
        }>;
    };
}, {}, `${string}/:runId/:index`>, import("elysia/types").MergeScopedSchemas<{}, {}, {}>>, {}, ({ params, status }: {
    params: AutomationScreenshotParams;
    status: RouteStatus;
}) => Promise<import("elysia").ElysiaStatus<200, Response, 200> | import("elysia").ElysiaStatus<400, {
    readonly error: "Invalid screenshot index format";
}, 400> | import("elysia").ElysiaStatus<400, {
    readonly error: "Invalid run ID format";
}, 400> | import("elysia").ElysiaStatus<404, {
    readonly error: "Screenshot not found";
}, 404> | import("elysia").ElysiaStatus<404, {
    readonly error: "Screenshot index out of range";
}, 404> | import("elysia").ElysiaStatus<404, {
    readonly error: "Invalid screenshot file metadata";
}, 404> | import("elysia").ElysiaStatus<404, {
    readonly error: "Screenshot file missing from disk";
}, 404>>>;
export {};
