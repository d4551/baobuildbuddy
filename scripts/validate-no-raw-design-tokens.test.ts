import { describe, expect, test } from "bun:test";
import { collectRawDesignTokenViolationsForContent } from "./validate-no-raw-design-tokens";

const SSOT_PATH = "packages/client/constants/layout.ts";
const MAIN_CSS_PATH = "packages/client/assets/css/main.css";
const LOADING_SKELETON_PATH = "packages/client/components/ui/LoadingSkeleton.vue";
const CONSUMER_PATH = "packages/client/pages/index.vue";

describe("collectRawDesignTokenViolationsForContent", () => {
  test("flags inline Tailwind spacing utility tokens in vue templates", () => {
    const violations = collectRawDesignTokenViolationsForContent(
      CONSUMER_PATH,
      '<template><div class="card-body flex flex-col justify-between p-5 md:p-6"></div></template>',
    );
    expect(violations.some((v) => v.message.includes("p-5"))).toBe(true);
  });

  test("flags inline rounded tokens", () => {
    const violations = collectRawDesignTokenViolationsForContent(
      CONSUMER_PATH,
      '<template><div class="rounded-2xl glass-subtle"></div></template>',
    );
    expect(violations.some((v) => v.message.includes("rounded-2xl"))).toBe(true);
  });

  test("flags inline shadow tokens", () => {
    const violations = collectRawDesignTokenViolationsForContent(
      "packages/client/components/ui/QuickActionFab.vue",
      '<template><button class="btn btn-primary shadow-lg">+</button></template>',
    );
    expect(violations.some((v) => v.message.includes("shadow-lg"))).toBe(true);
  });

  test("flags hardcoded SVG numeric attributes", () => {
    const violations = collectRawDesignTokenViolationsForContent(
      CONSUMER_PATH,
      '<template><svg width="12" height="12" viewBox="0 0 24 24"><circle cx="50" cy="50" r="42" stroke-width="8" /></svg></template>',
    );
    expect(violations.some((v) => v.message.includes('stroke-width="8"'))).toBe(true);
    expect(violations.some((v) => v.message.includes('width="12"'))).toBe(true);
  });

  test("flags design-token prop defaults baking in utility tokens", () => {
    const violations = collectRawDesignTokenViolationsForContent(
      "packages/client/components/ui/UiRadialMeter.vue",
      [
        '<script setup lang="ts">',
        'withDefaults(defineProps<{ sizeClass?: string }>(), { sizeClass: "h-24 w-24" });',
        "</script>",
        '<template><div :class="sizeClass" /></template>',
      ].join("\n"),
    );
    expect(violations.some((v) => v.message.includes("h-24 w-24"))).toBe(true);
  });

  test("flags raw palette literals", () => {
    const violations = collectRawDesignTokenViolationsForContent(
      CONSUMER_PATH,
      '<template><div class="bg-slate-500 text-white"></div></template>',
    );
    expect(violations.some((v) => v.message.includes("bg-slate-500"))).toBe(true);
    expect(violations.some((v) => v.message.includes("text-white"))).toBe(true);
  });

  test("flags hex color literals", () => {
    const violations = collectRawDesignTokenViolationsForContent(
      CONSUMER_PATH,
      '<template><div style="color: #fff"></div></template>',
    );
    expect(violations.some((v) => v.message.includes("#fff"))).toBe(true);
  });

  test("allows SSOT source files to define tokens", () => {
    const violations = collectRawDesignTokenViolationsForContent(
      SSOT_PATH,
      'export const SHELL_MAIN_INNER_CLASS = "mx-auto w-full min-w-0 max-w-7xl space-y-6 px-4 py-6";',
    );
    expect(violations).toHaveLength(0);
  });

  test("allows main.css to define oklch tokens", () => {
    const violations = collectRawDesignTokenViolationsForContent(
      MAIN_CSS_PATH,
      ":root { --radius-control: 0.625rem; --glass-blur-standard: 14px; color: oklch(0.9 0.02 250); }",
    );
    expect(violations).toHaveLength(0);
  });

  test("allows LoadingSkeleton primitive to define its own skeleton classes", () => {
    const violations = collectRawDesignTokenViolationsForContent(
      LOADING_SKELETON_PATH,
      '<template><div class="skeleton h-4 w-full rounded-box"></div></template>',
    );
    expect(violations).toHaveLength(0);
  });

  test("softening regression: does NOT allow h-24 in a consumer file", () => {
    const violations = collectRawDesignTokenViolationsForContent(
      "packages/client/components/example/ExampleWidget.vue",
      '<template><div class="h-24 w-24"></div></template>',
    );
    expect(violations.length).toBeGreaterThan(0);
  });

  test("softening regression: does NOT skip responsive breakpoint utility tokens", () => {
    const violations = collectRawDesignTokenViolationsForContent(
      "packages/client/components/example/ExampleWidget.vue",
      '<template><div class="w-64 lg:w-80"></div></template>',
    );
    expect(violations.some((v) => v.message.includes("lg:w-80"))).toBe(true);
  });

  test("softening regression: does NOT skip SVG width/height on non-icon files", () => {
    const violations = collectRawDesignTokenViolationsForContent(
      "packages/client/components/dashboard/Example.vue",
      '<template><svg width="12" height="12"></svg></template>',
    );
    expect(violations.some((v) => v.message.includes('width="12"'))).toBe(true);
  });
});
