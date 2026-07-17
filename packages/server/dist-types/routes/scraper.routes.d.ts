import type { RouteSetState } from "../types/route-state";
import { type ScraperPortalParams } from "./scraper-route-contracts";
export declare const scraperRoutes: import("elysia/types").AddRoute<string, "local", import("elysia/types").DefaultSingleton, {
    typebox: {};
    error: [];
}, import("elysia/types").DefaultMetadata, {
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
                error: never;
            };
        };
    };
}, import("elysia/types").DefaultEphemeral, import("elysia/types").DefaultEphemeral, "post", string, import("elysia/types").IntersectIfObjectSchema<import("elysia").UnwrapRoute<{
    detail: {
        tags: string[];
    };
    params: import("typebox").TObject<{
        portalId: import("typebox").TString;
    }>;
}, {}, `${string}/${string}`>, import("elysia/types").MergeScopedSchemas<{}, {}, {}>>, {}, ({ params, set }: {
    params: ScraperPortalParams;
    set: RouteSetState;
}) => Promise<import("@bao/shared/types/jobs").ScraperOperationResult | {
    error: string;
    details: string;
}>>;
