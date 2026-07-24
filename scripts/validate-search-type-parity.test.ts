import { describe, expect, it } from "bun:test";
import { collectSearchTypeParityViolations } from "./validate-search-type-parity";

const FULL_ROUTE_MAP = `export const SEARCH_TYPE_ROUTE: Record<SearchResultType, (id: string) => string> = {
  jobs: (id) => id,
  studios: (id) => id,
  resumes: (id) => id,
  skills: () => "/",
  "cover-letters": (id) => id,
  "portfolio-projects": () => "/",
  "interview-sessions": (id) => id,
  "automation-runs": (id) => id,
};`;

describe("validate-search-type-parity", () => {
  it("passes when route map covers all SEARCH_RESULT_TYPES", () => {
    const violations = collectSearchTypeParityViolations({
      clientRouteSource: FULL_ROUTE_MAP,
      serverContractSource: 'import { SEARCH_RESULT_TYPES } from "@bao/shared/constants/search";',
    });
    expect(violations).toEqual([]);
  });

  it("fails when a type is missing from client map", () => {
    const violations = collectSearchTypeParityViolations({
      clientRouteSource: `export const SEARCH_TYPE_ROUTE = { jobs: (id) => id };`,
      serverContractSource: 'import { SEARCH_RESULT_TYPES } from "@bao/shared/constants/search";',
    });
    expect(violations.some((v) => v.message.includes("cover-letters"))).toBe(true);
  });

  it("fails when server contract does not import shared search constants", () => {
    const violations = collectSearchTypeParityViolations({
      clientRouteSource: FULL_ROUTE_MAP,
      serverContractSource: "export const searchTypes = ['jobs'] as const;",
    });
    expect(violations.some((v) => v.message.includes("@bao/shared/constants/search"))).toBe(true);
  });
});
