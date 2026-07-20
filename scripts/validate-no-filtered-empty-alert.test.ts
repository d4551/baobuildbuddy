import { describe, expect, test } from "bun:test";
import { collectFilteredEmptyAlertViolationsForContent } from "./validate-no-filtered-empty-alert";

describe("validate-no-filtered-empty-alert", () => {
  test("flags FilteredEmptyAlert usage", () => {
    const violations = collectFilteredEmptyAlertViolationsForContent(
      "packages/client/pages/cover-letter/index.vue",
      `<FilteredEmptyAlert message-key="x" />`,
    );
    expect(violations.length).toBe(1);
  });

  test("allows EmptyState clear CTA", () => {
    const violations = collectFilteredEmptyAlertViolationsForContent(
      "packages/client/pages/cover-letter/index.vue",
      `<EmptyState title-key="a" description-key="b" cta-label-key="c" @cta="clearFilters" />`,
    );
    expect(violations.length).toBe(0);
  });
});
