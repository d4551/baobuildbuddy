import { describe, expect, test } from "bun:test";
import { collectEmptyStateCtaViolationsForContent } from "./validate-empty-state-ctas";

describe("validate-empty-state-ctas", () => {
  test("catalog EmptyState without CTA fails", () => {
    const violations = collectEmptyStateCtaViolationsForContent(
      "packages/client/pages/example.vue",
      `<EmptyState
      title-key="demo.emptyStateTitle"
      description-key="demo.emptyStateDescription"
    />`,
    );
    expect(violations.length).toBe(1);
    expect(violations[0]?.message).toContain("cta-label-key");
  });

  test("catalog EmptyState with empty CTA string fails", () => {
    const violations = collectEmptyStateCtaViolationsForContent(
      "packages/client/pages/example.vue",
      `<EmptyState
      title-key="demo.emptyStateTitle"
      description-key="demo.emptyStateDescription"
      cta-label-key=""
    />`,
    );
    expect(violations.length).toBe(1);
    expect(violations[0]?.message).toContain("non-empty");
  });

  test("catalog EmptyState with label but no action fails", () => {
    const violations = collectEmptyStateCtaViolationsForContent(
      "packages/client/pages/example.vue",
      `<EmptyState
      title-key="demo.emptyStateTitle"
      description-key="demo.emptyStateDescription"
      cta-label-key="demo.cta"
    />`,
    );
    expect(violations.length).toBe(1);
    expect(violations[0]?.message).toContain("cta-to or @cta");
  });

  test("catalog EmptyState with CTA + route passes", () => {
    const violations = collectEmptyStateCtaViolationsForContent(
      "packages/client/pages/example.vue",
      `<EmptyState
      title-key="demo.emptyStateTitle"
      description-key="demo.emptyStateDescription"
      cta-label-key="demo.cta"
      :cta-to="APP_ROUTES.jobs"
    />`,
    );
    expect(violations.length).toBe(0);
  });

  test("catalog EmptyState with CTA + @cta passes", () => {
    const violations = collectEmptyStateCtaViolationsForContent(
      "packages/client/pages/example.vue",
      `<EmptyState
      title-key="demo.emptyStateTitle"
      description-key="demo.emptyStateDescription"
      cta-label-key="demo.cta"
      @cta="openCreate()"
    />`,
    );
    expect(violations.length).toBe(0);
  });

  test("emptyCatalogTitle still requires wired CTA", () => {
    const violations = collectEmptyStateCtaViolationsForContent(
      "packages/client/pages/jobs/index.vue",
      `<EmptyState
      title-key="jobsPage.emptyCatalogTitle"
      description-key="jobsPage.emptyCatalogDescription"
      cta-label-key=""
    />`,
    );
    expect(violations.length).toBe(1);
  });
});
