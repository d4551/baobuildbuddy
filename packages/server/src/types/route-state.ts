/**
 * Shared Elysia route set-state type used across all route modules.
 *
 * Extracted to eliminate duplication across route-contracts files.
 */
export type RouteSetState = {
  status?: number | string;
};
