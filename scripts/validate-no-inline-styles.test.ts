import { describe, expect, test } from "bun:test";
import { collectInlineStyleViolationsForContent } from "./validate-no-inline-styles";

const CONSUMER_PATH = "packages/client/components/dashboard/ExampleWidget.vue";

describe("collectInlineStyleViolationsForContent: flags real inline style attribute on element", () => {
  test("flags real inline style attribute on element", () => {
    const violations = collectInlineStyleViolationsForContent(
      CONSUMER_PATH,
      '<template><div style="color: red"></div></template>',
    );
    expect(violations.some((v) => v.message.includes("style="))).toBe(true);
  });
});

describe("collectInlineStyleViolationsForContent: flags dynamic :style binding", () => {
  test("flags dynamic :style binding", () => {
    const violations = collectInlineStyleViolationsForContent(
      CONSUMER_PATH,
      "<template><div :style=\"{ color: 'red' }\"></div></template>",
    );
    expect(violations.some((v) => v.message.includes(":style"))).toBe(true);
  });
});

describe("collectInlineStyleViolationsForContent: does NOT flag @update:conversation-style event handler", () => {
  test("does NOT flag @update:conversation-style event handler", () => {
    const violations = collectInlineStyleViolationsForContent(
      CONSUMER_PATH,
      '<template><Child @update:conversation-style="onStyle" /></template>',
    );
    expect(violations).toHaveLength(0);
  });
});

describe("collectInlineStyleViolationsForContent: does NOT flag :class binding", () => {
  test("does NOT flag :class binding", () => {
    const violations = collectInlineStyleViolationsForContent(
      CONSUMER_PATH,
      '<template><div :class="surfaceClass"></div></template>',
    );
    expect(violations).toHaveLength(0);
  });
});

describe("collectInlineStyleViolationsForContent: does NOT flag style variable names without DOM writes", () => {
  test("does NOT flag style variable names without DOM writes", () => {
    const violations = collectInlineStyleViolationsForContent(
      CONSUMER_PATH,
      [
        '<script setup lang="ts">',
        'const style = "color: red";',
        "</script>",
        "<template><div /></template>",
      ].join("\n"),
    );
    expect(violations).toHaveLength(0);
  });
});

describe("collectInlineStyleViolationsForContent: flags .style. property writes outside brand allowlist", () => {
  test("flags .style. property writes outside brand allowlist", () => {
    const violations = collectInlineStyleViolationsForContent(
      CONSUMER_PATH,
      [
        '<script setup lang="ts">',
        "el.style.display = 'none';",
        "</script>",
        "<template><div /></template>",
      ].join("\n"),
    );
    expect(violations.some((v) => v.message.includes(".style."))).toBe(true);
  });
});

describe("collectInlineStyleViolationsForContent: flags setAttribute style writes outside brand allowlist", () => {
  test("flags setAttribute style writes outside brand allowlist", () => {
    const violations = collectInlineStyleViolationsForContent(
      "packages/client/utils/example.ts",
      'element.setAttribute("style", "color: red");',
    );
    expect(violations.some((v) => v.message.includes('setAttribute("style"'))).toBe(true);
  });
});

describe("collectInlineStyleViolationsForContent: allows brand CSS DOM style writes on allowlisted files", () => {
  test("allows brand CSS DOM style writes on allowlisted files", () => {
    const brandCss = collectInlineStyleViolationsForContent(
      "packages/client/plugins/brand-css.client.ts",
      "root.style.setProperty(key, value);",
    );
    const brandPreview = collectInlineStyleViolationsForContent(
      "packages/client/composables/useBrandPreviewStyles.ts",
      "root.style.removeProperty(key);",
    );
    expect(brandCss).toHaveLength(0);
    expect(brandPreview).toHaveLength(0);
  });
});

describe("collectInlineStyleViolationsForContent: flags single-quoted style attribute", () => {
  test("flags single-quoted style attribute", () => {
    const violations = collectInlineStyleViolationsForContent(
      CONSUMER_PATH,
      "<template><div style='display:none'></div></template>",
    );
    expect(violations.length).toBeGreaterThan(0);
  });
});
