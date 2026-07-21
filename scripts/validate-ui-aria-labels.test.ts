import { describe, expect, test } from "bun:test";
import { collectAriaLabelViolationsForContent } from "./validate-ui-aria-labels";

const CONSUMER_PATH = "packages/client/components/example/ExampleWidget.vue";

describe("collectAriaLabelViolationsForContent: flags icon-only buttons without aria-label", () => {
  test("flags icon-only buttons without aria-label", () => {
    const violations = collectAriaLabelViolationsForContent(
      CONSUMER_PATH,
      "<template><button><svg></svg></button></template>",
    );
    expect(violations.some((v) => v.message.includes("Icon-only"))).toBe(true);
  });
});

describe("collectAriaLabelViolationsForContent: passes icon-only buttons with aria-label", () => {
  test("passes icon-only buttons with aria-label", () => {
    const violations = collectAriaLabelViolationsForContent(
      CONSUMER_PATH,
      '<template><button aria-label="Close"><svg></svg></button></template>',
    );
    expect(violations.some((v) => v.message.includes("Icon-only"))).toBe(false);
  });
});

describe("collectAriaLabelViolationsForContent: flags dialogs without aria-modal", () => {
  test("flags dialogs without aria-modal", () => {
    const violations = collectAriaLabelViolationsForContent(
      CONSUMER_PATH,
      '<template><dialog class="modal"><p>x</p></dialog></template>',
    );
    expect(violations.some((v) => v.message.includes("aria-modal"))).toBe(true);
  });
});

describe("collectAriaLabelViolationsForContent: passes dialogs with aria-modal and aria-label", () => {
  test("passes dialogs with aria-modal and aria-label", () => {
    const violations = collectAriaLabelViolationsForContent(
      CONSUMER_PATH,
      '<template><dialog aria-modal="true" aria-label="Confirm"><p>x</p></dialog></template>',
    );
    expect(violations.some((v) => v.message.includes("aria-modal"))).toBe(false);
  });
});

describe("collectAriaLabelViolationsForContent: flags form controls without aria-label", () => {
  test("flags form controls without aria-label", () => {
    const violations = collectAriaLabelViolationsForContent(
      CONSUMER_PATH,
      '<template><input type="text" /></template>',
    );
    expect(violations.some((v) => v.message.includes("aria-label"))).toBe(true);
  });
});

describe("collectAriaLabelViolationsForContent: flags hidden inputs are skipped", () => {
  test("flags hidden inputs are skipped", () => {
    const violations = collectAriaLabelViolationsForContent(
      CONSUMER_PATH,
      '<template><input type="hidden" name="csrf" value="x" /></template>',
    );
    expect(violations.every((v) => !v.message.includes("aria-label"))).toBe(true);
  });
});

describe("collectAriaLabelViolationsForContent: softening regression: flags icon-only <a> tags too", () => {
  test("softening regression: flags icon-only <a> tags too", () => {
    const violations = collectAriaLabelViolationsForContent(
      CONSUMER_PATH,
      '<template><a href="/x"><svg></svg></a></template>',
    );
    expect(violations.some((v) => v.message.includes("Icon-only"))).toBe(true);
  });
});

describe("collectAriaLabelViolationsForContent: softening regression: flags role=button on generic div without aria-label", () => {
  test("softening regression: flags role=button on generic div without aria-label", () => {
    const violations = collectAriaLabelViolationsForContent(
      CONSUMER_PATH,
      '<template><div role="button" tabindex="0"></div></template>',
    );
    expect(violations.length).toBeGreaterThan(0);
  });
});

describe("collectAriaLabelViolationsForContent: landmark regression: passes main tabindex=-1 as skip-link target", () => {
  test('landmark regression: passes <main tabindex="-1"> as skip-link target', () => {
    const violations = collectAriaLabelViolationsForContent(
      CONSUMER_PATH,
      '<template><main id="main-content" tabindex="-1"><slot /></main></template>',
    );
    expect(violations.every((v) => !v.message.includes("Focusable non-native containers"))).toBe(
      true,
    );
  });
});

describe("collectAriaLabelViolationsForContent: landmark regression: still flags main tabindex=0 in tab order", () => {
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
