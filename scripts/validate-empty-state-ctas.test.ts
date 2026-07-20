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

  test("catalog EmptyState with CTA passes", () => {
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
});
