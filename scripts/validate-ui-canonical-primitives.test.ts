import { describe, expect, test } from "bun:test";
import { collectUiCanonicalPrimitiveViolationsForContent } from "./validate-ui-canonical-primitives";

const PAGE_PATH = "packages/client/pages/example.vue";
const COMPONENT_PATH = "packages/client/components/example/ExampleWidget.vue";

describe("collectUiCanonicalPrimitiveViolationsForContent", () => {
  test("flags inline card card-border card-glass literals without SURFACE_GLASS_CARD_CLASS import", () => {
    const violations = collectUiCanonicalPrimitiveViolationsForContent(
      COMPONENT_PATH,
      [
        "<template>",
        '<div class="card card-border card-glass glass-interactive h-full"></div>',
        "</template>",
      ].join("\n"),
    );
    expect(violations.some((v) => v.message.includes("SURFACE_GLASS_CARD_CLASS"))).toBe(true);
  });

  test("passes when file references SURFACE_GLASS_CARD_CLASS", () => {
    const violations = collectUiCanonicalPrimitiveViolationsForContent(
      COMPONENT_PATH,
      [
        '<script setup lang="ts">',
        'import { SURFACE_GLASS_CARD_CLASS } from "~/constants/layout";',
        "</script>",
        "<template>",
        "<div :class=\"[SURFACE_GLASS_CARD_CLASS, 'h-full']\"></div>",
        "</template>",
      ].join("\n"),
    );
    expect(violations.some((v) => v.message.includes("SURFACE_GLASS_CARD_CLASS"))).toBe(false);
  });

  test("flags inline loading-spinner literals without LoadingSpinner primitive", () => {
    const violations = collectUiCanonicalPrimitiveViolationsForContent(
      COMPONENT_PATH,
      '<template><span class="loading loading-spinner loading-xs"></span></template>',
    );
    expect(violations.some((v) => v.message.includes("LoadingSpinner"))).toBe(true);
  });

  test("passes when LoadingSpinner primitive is imported", () => {
    const violations = collectUiCanonicalPrimitiveViolationsForContent(
      COMPONENT_PATH,
      [
        '<script setup lang="ts">',
        'import LoadingSpinner from "~/components/ui/LoadingSpinner.vue";',
        "</script>",
        "<template>",
        '<span class="loading loading-spinner loading-xs"></span>',
        "</template>",
      ].join("\n"),
    );
    expect(violations.some((v) => v.message.includes("LoadingSpinner"))).toBe(false);
  });

  test("flags raw HTML table without daisyUI table primitive", () => {
    const violations = collectUiCanonicalPrimitiveViolationsForContent(
      COMPONENT_PATH,
      "<template><table><thead><tr><th>X</th></tr></thead></table></template>",
    );
    expect(violations.some((v) => v.message.includes("daisyUI table"))).toBe(true);
  });

  test("flags raw progress element without daisyUI progress primitive", () => {
    const violations = collectUiCanonicalPrimitiveViolationsForContent(
      COMPONENT_PATH,
      '<template><progress value="40" max="100"></progress></template>',
    );
    expect(violations.some((v) => v.message.includes("daisyUI progress"))).toBe(true);
  });

  test("softening regression: flags card-glass even with extra classes around it", () => {
    const violations = collectUiCanonicalPrimitiveViolationsForContent(
      COMPONENT_PATH,
      '<template><div class="relative card card-border card-glass glass-interactive h-full overflow-hidden"></div></template>',
    );
    expect(violations.length).toBeGreaterThan(0);
  });

  test("softening regression: page with isEmpty but no EmptyState primitive fails", () => {
    const violations = collectUiCanonicalPrimitiveViolationsForContent(
      PAGE_PATH,
      [
        '<script setup lang="ts">',
        'const isEmpty = true; const uiState = "empty";',
        "</script>",
        "<template>",
        "<LoadingSkeleton v-if=\"uiState === 'loading'\" />",
        "</template>",
      ].join("\n"),
    );
    expect(violations.some((v) => v.message.includes("EmptyState"))).toBe(true);
  });
});
