import { describe, expect, test } from "bun:test";
import { collectRouteQuerySsotViolationsForContent } from "./validate-route-query-ssot";

describe("validate-route-query-ssot", () => {
  test("flags section query without route-query SSOT helper", () => {
    const violations = collectRouteQuerySsotViolationsForContent(
      "packages/client/pages/example.vue",
      `const section = APP_ROUTE_QUERY_KEYS.section;\nconst raw = route.query[section];`,
    );
    expect(violations.length).toBeGreaterThan(0);
  });

  test("allows resolveRouteSectionId import", () => {
    const violations = collectRouteQuerySsotViolationsForContent(
      "packages/client/pages/settings.vue",
      `import { resolveRouteSectionId } from "~/utils/route-query";\nconst key = APP_ROUTE_QUERY_KEYS.section;`,
    );
    expect(violations).toEqual([]);
  });
});
