import { describe, expect, test } from "bun:test";
import { collectEmptyStateCtaViolationsForContent } from "./validate-empty-state-ctas";

describe("validate-empty-state-ctas", () => {
  test("EmptyState without CTA fails", () => {
    const violations = collectEmptyStateCtaViolationsForContent(
      "packages/client/pages/example.vue",
      `<EmptyState
      title-key="demo.anyTitle"
      description-key="demo.anyDescription"
    />`,
    );
    expect(violations.length).toBe(1);
    expect(violations[0]?.message).toContain("cta-label-key");
  });

  test("EmptyState with empty CTA string fails", () => {
    const violations = collectEmptyStateCtaViolationsForContent(
      "packages/client/pages/example.vue",
      `<EmptyState
      title-key="demo.anyTitle"
      description-key="demo.anyDescription"
      cta-label-key=""
    />`,
    );
    expect(violations.length).toBe(1);
    expect(violations[0]?.message).toContain("non-empty");
  });

  test("EmptyState with label but no action fails", () => {
    const violations = collectEmptyStateCtaViolationsForContent(
      "packages/client/pages/example.vue",
      `<EmptyState
      title-key="demo.anyTitle"
      description-key="demo.anyDescription"
      cta-label-key="demo.cta"
    />`,
    );
    expect(violations.length).toBe(1);
    expect(violations[0]?.message).toContain("cta-to or @cta");
  });

  test("EmptyState with CTA + route passes", () => {
    const violations = collectEmptyStateCtaViolationsForContent(
      "packages/client/pages/example.vue",
      `<EmptyState
      title-key="demo.anyTitle"
      description-key="demo.anyDescription"
      cta-label-key="demo.cta"
      :cta-to="APP_ROUTES.jobs"
    />`,
    );
    expect(violations.length).toBe(0);
  });

  test("EmptyState with CTA + @cta passes", () => {
    const violations = collectEmptyStateCtaViolationsForContent(
      "packages/client/pages/example.vue",
      `<EmptyState
      title-key="demo.anyTitle"
      description-key="demo.anyDescription"
      cta-label-key="demo.cta"
      @cta="openCreate()"
    />`,
    );
    expect(violations.length).toBe(0);
  });

  test("chat EmptyState without CTA fails — SKIP_FILES softening banned", () => {
    const violations = collectEmptyStateCtaViolationsForContent(
      "packages/client/components/ai/AIChatConversationPanel.vue",
      `<EmptyState
      title-key="ai.empty"
      description-key="ai.emptyDesc"
    />`,
    );
    expect(violations.length).toBe(1);
  });
});
