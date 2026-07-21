import { describe, expect, test } from "bun:test";
import { findOrphanRoutes, isSubRouteOfNav } from "./validate-route-nav-coverage";

describe("findOrphanRoutes", () => {
  test("flags a route with no nav entry, no redirect, no dynamic, no allowlist (VACUOUS_GATE_TEST)", () => {
    const pages = [
      {
        filePath: "packages/client/pages/index.vue",
        route: "/",
        isRedirect: false,
        isDynamic: false,
      },
      {
        filePath: "packages/client/pages/orphan.vue",
        route: "/orphan",
        isRedirect: false,
        isDynamic: false,
      },
    ];
    const navPaths = new Set(["/"]);
    const violations = findOrphanRoutes(pages, navPaths, new Set());
    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain("/orphan");
  });

  test("allows a redirect-only page", () => {
    const pages = [
      {
        filePath: "packages/client/pages/redirect.vue",
        route: "/redirect",
        isRedirect: true,
        isDynamic: false,
      },
    ];
    const violations = findOrphanRoutes(pages, new Set(), new Set());
    expect(violations).toHaveLength(0);
  });

  test("allows a dynamic child page", () => {
    const pages = [
      {
        filePath: "packages/client/pages/jobs/[id].vue",
        route: "/jobs/:id",
        isRedirect: false,
        isDynamic: true,
      },
    ];
    const violations = findOrphanRoutes(pages, new Set(), new Set());
    expect(violations).toHaveLength(0);
  });

  test("allows a sub-route of a nav entry", () => {
    const pages = [
      {
        filePath: "packages/client/pages/resume/build.vue",
        route: "/resume/build",
        isRedirect: false,
        isDynamic: false,
      },
    ];
    const navPaths = new Set(["/resume"]);
    const violations = findOrphanRoutes(pages, navPaths, new Set());
    expect(violations).toHaveLength(0);
  });

  test("allows a route in the allowlist", () => {
    const pages = [
      {
        filePath: "packages/client/pages/setup.vue",
        route: "/setup",
        isRedirect: false,
        isDynamic: false,
      },
    ];
    const violations = findOrphanRoutes(pages, new Set(), new Set(["/setup"]));
    expect(violations).toHaveLength(0);
  });
});

describe("sub-route matching", () => {
  test("matches exact route", () => {
    expect(isSubRouteOfNav("/jobs", new Set(["/jobs"]))).toBe(true);
  });

  test("matches child route", () => {
    expect(isSubRouteOfNav("/resume/build", new Set(["/resume"]))).toBe(true);
  });

  test("does not match unrelated route", () => {
    expect(isSubRouteOfNav("/settings", new Set(["/jobs"]))).toBe(false);
  });
});
