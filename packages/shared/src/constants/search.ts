/**
 * Canonical workspace unified-search result types (plural API wire format).
 * Owner for server OpenAPI contracts, SearchService, and client OmniSearch routing.
 */
export const SEARCH_RESULT_TYPES = [
  "jobs",
  "studios",
  "skills",
  "resumes",
  "cover-letters",
  "portfolio-projects",
  "interview-sessions",
  "automation-runs",
] as const;

export type SearchResultType = (typeof SEARCH_RESULT_TYPES)[number];

export const DEFAULT_SEARCH_RESULT_TYPES: readonly SearchResultType[] = SEARCH_RESULT_TYPES;
