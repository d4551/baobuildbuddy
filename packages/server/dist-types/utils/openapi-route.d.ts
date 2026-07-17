/**
 * Attaches OpenAPI operation tags to an Elysia 2 route hooks object.
 * Guard-level tags are dropped when a route declares body/response hooks, so
 * tags must live on each route's `detail` block.
 */
export declare function withOpenApiTag<THooks extends Record<string, unknown>>(tag: string, hooks?: THooks): THooks & {
    detail: {
        tags: string[];
    };
};
