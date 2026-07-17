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
                    200: {
                        scraped: number;
                        upserted: number;
                        errors: string[];
                        enrichment: {
                            enabled: boolean;
                            enrichedRecords: number;
                            warnings: string[];
                            provider?: string | undefined;
                            model?: string | undefined;
                        };
                    };
                    400: {
                        error: string;
                        details?: string | undefined;
                    };
                    500: {
                        error: string;
                        details?: string | undefined;
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
    response: {
        readonly 200: import("typebox").TObject<{
            scraped: import("typebox").TNumber;
            upserted: import("typebox").TNumber;
            errors: import("typebox").TArray<import("typebox").TString>;
            enrichment: import("typebox").TObject<{
                enabled: import("typebox").TBoolean;
                enrichedRecords: import("typebox").TNumber;
                warnings: import("typebox").TArray<import("typebox").TString>;
                provider: import("typebox").TOptional<import("typebox").TString>;
                model: import("typebox").TOptional<import("typebox").TString>;
            }>;
        }>;
        readonly 400: import("typebox").TObject<{
            error: import("typebox").TString;
            details: import("typebox").TOptional<import("typebox").TString>;
        }>;
        readonly 500: import("typebox").TObject<{
            error: import("typebox").TString;
            details: import("typebox").TOptional<import("typebox").TString>;
        }>;
    };
}, {}, `${string}/${string}`>, import("elysia/types").MergeScopedSchemas<{}, {}, {}>>, {}, ({ params, status }: {
    body: unknown;
    query: Record<string, string | undefined>;
    params: {
        portalId: string;
    };
    headers: Record<string, string | undefined>;
    cookie: Record<string, import("elysia").Cookie<unknown>>;
    server: import("elysia").Server | null;
    redirect: import("elysia").redirect;
    set: {
        headers: import("elysia").HTTPHeaders;
        status?: number | keyof import("elysia").StatusMap;
        cookie?: Record<string, import("elysia").BaseCookie>;
    };
    readonly path: string;
    route?: string;
    rid?: string;
    request: Request;
    store: {};
    status: import("elysia").SelectiveStatus<{
        readonly 200: {
            scraped: number;
            upserted: number;
            errors: string[];
            enrichment: {
                enabled: boolean;
                enrichedRecords: number;
                warnings: string[];
                provider?: string | undefined;
                model?: string | undefined;
            };
        };
        readonly 400: {
            error: string;
            details?: string | undefined;
        };
        readonly 500: {
            error: string;
            details?: string | undefined;
        };
    }>;
}) => Promise<import("elysia").ElysiaStatus<200, import("@bao/shared/types/jobs").ScraperOperationResult, 200> | import("elysia").ElysiaStatus<400, {
    error: string;
    details: string;
}, 400> | import("elysia").ElysiaStatus<500, {
    error: string;
    details: string;
}, 500>>>;
