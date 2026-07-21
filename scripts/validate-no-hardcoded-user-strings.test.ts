import { describe, expect, test } from "bun:test";
import { collectHardcodedUserStringViolationsForContent } from "./validate-no-hardcoded-user-strings";

const CATALOG_PATH = "packages/client/locales/en-US/portfolioPage.ts";
const COMPONENT_PATH = "packages/client/components/example/ExampleWidget.vue";

describe("collectHardcodedUserStringViolationsForContent", () => {
  test("flags 'John Doe' placeholder value in i18n catalog (VACUOUS_GATE_TEST)", () => {
    const content = 'titlePlaceholder: "e.g. John Doe - Game Developer",';
    const violations = collectHardcodedUserStringViolationsForContent(CATALOG_PATH, content);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations.some((v) => v.message.includes("John Doe"))).toBe(true);
  });

  test("flags 'example.com' URL placeholder in i18n catalog", () => {
    const content = 'jobUrlPlaceholder: "https://example.com/jobs/123",';
    const violations = collectHardcodedUserStringViolationsForContent(CATALOG_PATH, content);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations.some((v) => v.message.includes("example.com"))).toBe(true);
  });

  test("flags '+1 (555)' phone placeholder in i18n catalog", () => {
    const content = 'phonePlaceholder: "+1 (555) 123-4567",';
    const violations = collectHardcodedUserStringViolationsForContent(CATALOG_PATH, content);
    expect(violations.length).toBeGreaterThan(0);
  });

  test("allows instructional placeholder in i18n catalog", () => {
    const content = 'titlePlaceholder: "Enter your portfolio title",';
    const violations = collectHardcodedUserStringViolationsForContent(CATALOG_PATH, content);
    expect(violations).toHaveLength(0);
  });

  test("skips general hardcoded-string check for locale catalogs", () => {
    const content = 'title: "My Portfolio Page",';
    const violations = collectHardcodedUserStringViolationsForContent(CATALOG_PATH, content);
    expect(violations).toHaveLength(0);
  });

  test("flags keyed literal in non-catalog component file", () => {
    const content = 'useSeoMeta({ title: "Hello World" });';
    const violations = collectHardcodedUserStringViolationsForContent(COMPONENT_PATH, content);
    expect(violations.length).toBeGreaterThan(0);
  });
});
