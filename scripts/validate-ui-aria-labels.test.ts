import { describe, expect, test } from "bun:test";
import { collectAriaLabelViolationsForContent } from "./validate-ui-aria-labels";

const CONSUMER_PATH = "packages/client/components/example/ExampleWidget.vue";

describe("collectAriaLabelViolationsForContent", () => {
  test("flags icon-only buttons without aria-label", () => {
    const violations = collectAriaLabelViolationsForContent(
      CONSUMER_PATH,
      "<template><button><svg></svg></button></template>",
    );
    expect(violations.some((v) => v.message.includes("Icon-only"))).toBe(true);
  });

  test("passes icon-only buttons with aria-label", () => {
    const violations = collectAriaLabelViolationsForContent(
      CONSUMER_PATH,
      '<template><button aria-label="Close"><svg></svg></button></template>',
    );
    expect(violations.some((v) => v.message.includes("Icon-only"))).toBe(false);
  });

  test("flags dialogs without aria-modal", () => {
    const violations = collectAriaLabelViolationsForContent(
      CONSUMER_PATH,
      '<template><dialog class="modal"><p>x</p></dialog></template>',
    );
    expect(violations.some((v) => v.message.includes("aria-modal"))).toBe(true);
  });

  test("passes dialogs with aria-modal and aria-label", () => {
    const violations = collectAriaLabelViolationsForContent(
      CONSUMER_PATH,
      '<template><dialog aria-modal="true" aria-label="Confirm"><p>x</p></dialog></template>',
    );
    expect(violations.some((v) => v.message.includes("aria-modal"))).toBe(false);
  });

  test("flags form controls without aria-label", () => {
    const violations = collectAriaLabelViolationsForContent(
      CONSUMER_PATH,
      '<template><input type="text" /></template>',
    );
    expect(violations.some((v) => v.message.includes("aria-label"))).toBe(true);
  });

  test("flags hidden inputs are skipped", () => {
    const violations = collectAriaLabelViolationsForContent(
      CONSUMER_PATH,
      '<template><input type="hidden" name="csrf" value="x" /></template>',
    );
    expect(violations.every((v) => !v.message.includes("aria-label"))).toBe(true);
  });

  test("softening regression: flags icon-only <a> tags too", () => {
    const violations = collectAriaLabelViolationsForContent(
      CONSUMER_PATH,
      '<template><a href="/x"><svg></svg></a></template>',
    );
    expect(violations.some((v) => v.message.includes("Icon-only"))).toBe(true);
  });

  test("softening regression: flags role=button on generic div without aria-label", () => {
    const violations = collectAriaLabelViolationsForContent(
      CONSUMER_PATH,
      '<template><div role="button" tabindex="0"></div></template>',
    );
    expect(violations.length).toBeGreaterThan(0);
  });

  test('landmark regression: passes <main tabindex="-1"> as skip-link target', () => {
    const violations = collectAriaLabelViolationsForContent(
      CONSUMER_PATH,
      '<template><main id="main-content" tabindex="-1"><slot /></main></template>',
    );
    expect(violations.every((v) => !v.message.includes("Focusable non-native containers"))).toBe(
      true,
    );
  });

  test('landmark regression: still flags <main tabindex="0"> in tab order', () => {
    const violations = collectAriaLabelViolationsForContent(
      CONSUMER_PATH,
      '<template><main id="main-content" tabindex="0"><slot /></main></template>',
    );
    expect(violations.some((v) => v.message.includes("Focusable non-native containers"))).toBe(
      true,
    );
  });
});
