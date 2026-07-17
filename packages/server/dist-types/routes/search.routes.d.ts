import { type SearchAutocompleteQuery } from "./search-route-contracts";
export declare const searchRoutes: import("elysia/types").AddRoute<string, "local", import("elysia/types").DefaultSingleton, {
    typebox: {};
    error: [];
}, import("elysia/types").DefaultMetadata, {
    [x: string]: {
        [x: string]: {
            get: {
                body: unknown;
                params: {};
                query: {
                    q?: string | undefined;
                    types?: string | undefined;
                };
                headers: unknown;
                response: {
                    200: {
                        query: string;
                        results: {
                            type: "jobs" | "resumes" | "skills" | "studios";
                            id: string;
                            title: string;
                            subtitle: string;
                            snippet: string;
                            relevance: number;
                        }[];
                        counts: {
                            jobs: number;
                            studios: number;
                            skills: number;
                            resumes: number;
                        };
                        totalTime: number;
                    };
                    422: {
                        type: 'validation';
                        title: 'Validation Error';
                        status: 422;
                        detail?: string;
                        on: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
                error: never;
            };
        };
    };
}, import("elysia/types").DefaultEphemeral, import("elysia/types").DefaultEphemeral, "get", string, import("elysia/types").IntersectIfObjectSchema<import("elysia").UnwrapRoute<{
    detail: {
        tags: string[];
    };
    query: import("typebox").TObject<{
        prefix: import("typebox").TOptional<import("typebox").TString>;
    }>;
    response: {
        readonly 200: import("typebox").TArray<import("typebox").TObject<{
            text: import("typebox").TString;
            type: import("typebox").TString;
        }>>;
    };
}, {}, `${string}/${string}`>, import("elysia/types").MergeScopedSchemas<{}, {}, {}>>, {}, ({ query }: {
    query: SearchAutocompleteQuery;
}) => Promise<{
    text: string;
    type: string;
}[]>>;
