import type { RouteSetState } from "../types/route-state";
import { type AutomationScreenshotParams } from "./automation-screenshot-route-contracts";
/**
 * Serves automation run screenshots from managed run directories.
 */
export declare const automationScreenshotRoutes: import("elysia/types").AddRoute<string, "local", import("elysia/types").DefaultSingleton, {
    typebox: {};
    error: [];
}, import("elysia/types").DefaultMetadata, {}, import("elysia/types").DefaultEphemeral, import("elysia/types").DefaultEphemeral, "get", "/:runId/:index", import("elysia/types").IntersectIfObjectSchema<import("elysia").UnwrapRoute<{
    detail: {
        tags: string[];
    };
    params: import("typebox").TObject<{
        runId: import("typebox").TString;
        index: import("typebox").TString;
    }>;
}, {}, `${string}/:runId/:index`>, import("elysia/types").MergeScopedSchemas<{}, {}, {}>>, {}, ({ params, set }: {
    params: AutomationScreenshotParams;
    set: RouteSetState;
}) => Promise<Response | {
    error: string;
}>>;
