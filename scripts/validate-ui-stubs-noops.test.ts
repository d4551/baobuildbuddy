import { describe, expect, test } from "bun:test";
import { collectStubNoopViolationsForContent } from "./validate-ui-stubs-noops";

const CONSUMER_PATH = "packages/client/pages/jobs/index.vue";
/** Build banned debt token at runtime so the test source itself is not flagged. */
const debtTodoToken = ["TO", "DO"].join("");

describe("collectStubNoopViolationsForContent", () => {
  test("flags inert @click empty-string handler", () => {
    const violations = collectStubNoopViolationsForContent(
      CONSUMER_PATH,
      '<template><button @click="">x</button></template>',
    );
    expect(violations.some((v) => v.message.includes("Inert event handler"))).toBe(true);
  });

  test("flags inert @click noop handler", () => {
    const violations = collectStubNoopViolationsForContent(
      CONSUMER_PATH,
      '<template><button @click="noop">x</button></template>',
    );
    expect(violations.some((v) => v.message.includes("noop"))).toBe(true);
  });

  test("flags placeholder copy Lorem ipsum", () => {
    const violations = collectStubNoopViolationsForContent(
      CONSUMER_PATH,
      "<template><p>Lorem ipsum dolor sit amet</p></template>",
    );
    expect(violations.some((v) => v.message.includes("Lorem"))).toBe(true);
  });

  test("flags debt vocabulary comment in script", () => {
    const violations = collectStubNoopViolationsForContent(
      CONSUMER_PATH,
      [
        '<script setup lang="ts">',
        `// ${debtTodoToken}: wire this up`,
        "</script>",
        "<template><div /></template>",
      ].join("\n"),
    );
    expect(violations.some((v) => v.message.includes(debtTodoToken))).toBe(true);
  });

  test("flags dead CTA button with no handler", () => {
    const violations = collectStubNoopViolationsForContent(
      CONSUMER_PATH,
      '<template><button class="btn">Submit</button></template>',
    );
    expect(violations.some((v) => v.message.includes("Dead CTA"))).toBe(true);
  });

  test("flags dead icon-only button with nested content", () => {
    const violations = collectStubNoopViolationsForContent(
      CONSUMER_PATH,
      [
        "<template>",
        '<button type="button" class="btn btn-ghost">',
        '  <svg class="h-4 w-4" />',
        "</button>",
        "</template>",
      ].join("\n"),
    );
    expect(violations.some((v) => v.message.includes("Dead CTA"))).toBe(true);
  });

  test("flags dead .btn on non-button element", () => {
    const violations = collectStubNoopViolationsForContent(
      CONSUMER_PATH,
      '<template><span class="btn btn-primary">Go</span></template>',
    );
    expect(violations.some((v) => v.message.includes("Dead CTA"))).toBe(true);
  });

  test("flags dead role=button without wiring", () => {
    const violations = collectStubNoopViolationsForContent(
      CONSUMER_PATH,
      '<template><div role="button" class="card">Open</div></template>',
    );
    expect(violations.some((v) => v.message.includes("Dead CTA"))).toBe(true);
  });

  test("allows wired button with @click", () => {
    const violations = collectStubNoopViolationsForContent(
      CONSUMER_PATH,
      '<template><button class="btn" @click="onSubmit">Submit</button></template>',
    );
    expect(violations.filter((v) => v.message.includes("Dead CTA"))).toHaveLength(0);
  });

  test("allows disabled button with no handler", () => {
    const violations = collectStubNoopViolationsForContent(
      CONSUMER_PATH,
      '<template><button class="btn" disabled>Loading</button></template>',
    );
    expect(violations.filter((v) => v.message.includes("Dead CTA"))).toHaveLength(0);
  });

  test("allows label.btn with for= association", () => {
    const violations = collectStubNoopViolationsForContent(
      CONSUMER_PATH,
      '<template><label for="app-drawer" class="btn btn-ghost" role="button">Menu</label></template>',
    );
    expect(violations.filter((v) => v.message.includes("Dead CTA"))).toHaveLength(0);
  });

  test("allows NuxtLink with :to", () => {
    const violations = collectStubNoopViolationsForContent(
      CONSUMER_PATH,
      '<template><NuxtLink class="btn btn-ghost" :to="/jobs">Jobs</NuxtLink></template>',
    );
    expect(violations.filter((v) => v.message.includes("Dead CTA"))).toHaveLength(0);
  });

  test("allows multiline wired button", () => {
    const violations = collectStubNoopViolationsForContent(
      CONSUMER_PATH,
      [
        "<template>",
        "<button",
        '  type="button"',
        '  class="btn btn-primary"',
        '  @click="save"',
        ">",
        "  Save",
        "</button>",
        "</template>",
      ].join("\n"),
    );
    expect(violations.filter((v) => v.message.includes("Dead CTA"))).toHaveLength(0);
  });

  test("banned vocabulary skips authority paths only", () => {
    const violations = collectStubNoopViolationsForContent(
      "packages/client/constants/layout.ts",
      `// ${debtTodoToken}: not scanned on authority\nexport const X = 1;\n`,
    );
    expect(violations).toHaveLength(0);
  });

  test("allows daisyUI swap label wrapping theme-controller input", () => {
    const violations = collectStubNoopViolationsForContent(
      CONSUMER_PATH,
      [
        "<template>",
        '<label class="swap swap-rotate btn btn-ghost btn-circle">',
        '  <input type="checkbox" class="theme-controller" value="business" />',
        "</label>",
        "</template>",
      ].join("\n"),
    );
    expect(violations.filter((v) => v.message.includes("Dead CTA"))).toHaveLength(0);
  });

  test("allows details summary.btn disclosure chrome", () => {
    const violations = collectStubNoopViolationsForContent(
      CONSUMER_PATH,
      [
        "<template>",
        "<details>",
        '  <summary class="btn btn-ghost btn-circle" aria-label="menu">…</summary>',
        "</details>",
        "</template>",
      ].join("\n"),
    );
    expect(violations.filter((v) => v.message.includes("Dead CTA"))).toHaveLength(0);
  });

  test("allows PascalCase Vue SFC controls that encapsulate wiring", () => {
    const violations = collectStubNoopViolationsForContent(
      CONSUMER_PATH,
      '<template><AppExportMenu summary-class="btn btn-sm" @export="onExport" /></template>',
    );
    expect(violations.filter((v) => v.message.includes("Dead CTA"))).toHaveLength(0);
  });

  test("banned vocabulary skips locale catalogs (natural-language copy)", () => {
    const violations = collectStubNoopViolationsForContent(
      "packages/client/locales/es-ES/catalog.ts",
      'export default { all: "todo" };\n',
    );
    expect(violations).toHaveLength(0);
  });

  test("allows aria-hidden preview .btn chrome", () => {
    const violations = collectStubNoopViolationsForContent(
      CONSUMER_PATH,
      '<template><span class="btn btn-accent" aria-hidden="true">Preview</span></template>',
    );
    expect(violations.filter((v) => v.message.includes("Dead CTA"))).toHaveLength(0);
  });
});
