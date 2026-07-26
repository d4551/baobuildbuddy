import { describe, expect, test } from "bun:test";
import { collectThemeAttributeViolationsForContent } from "./validate-theme-attribute-ownership";

/** The exact regression this validator exists for: the shell drawer re-declaring the theme. */
const NESTED_BINDING_SOURCE = `<template>
  <div class="drawer" :class="SHELL_DRAWER_CLASS" :data-theme="theme">
    <slot />
  </div>
</template>`;

const STATIC_ATTRIBUTE_SOURCE = `<template>
  <section data-theme="business"><slot /></section>
</template>`;

const CLEAN_SOURCE = `<template>
  <div class="drawer" :class="SHELL_DRAWER_CLASS">
    <slot />
  </div>
</template>`;

describe("collectThemeAttributeViolationsForContent", () => {
  test("flags a nested `:data-theme` binding in a layout", () => {
    const violations = collectThemeAttributeViolationsForContent(
      "packages/client/layouts/default.vue",
      NESTED_BINDING_SOURCE,
    );
    expect(violations).toHaveLength(1);
    expect(violations[0]?.line).toBe(2);
    expect(violations[0]?.message).toContain("brand palette");
  });

  test("flags a static nested `data-theme` attribute", () => {
    const violations = collectThemeAttributeViolationsForContent(
      "packages/client/components/layout/ThemePreview.vue",
      STATIC_ATTRIBUTE_SOURCE,
    );
    expect(violations).toHaveLength(1);
    expect(violations[0]?.line).toBe(2);
  });

  test("flags a `v-bind:data-theme` binding", () => {
    const violations = collectThemeAttributeViolationsForContent(
      "packages/client/layouts/auth-shell.vue",
      '<template><main v-bind:data-theme="theme" /></template>',
    );
    expect(violations).toHaveLength(1);
  });

  test("flags imperative setAttribute writes outside the owner", () => {
    const violations = collectThemeAttributeViolationsForContent(
      "packages/client/composables/useSomething.ts",
      'document.documentElement.setAttribute("data-theme", next);',
    );
    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain("setTheme");
  });

  test("flags imperative dataset writes outside the owner", () => {
    const violations = collectThemeAttributeViolationsForContent(
      "packages/client/plugins/theme.client.ts",
      "document.documentElement.dataset.theme = next;",
    );
    expect(violations).toHaveLength(1);
  });

  test("allows the single owner to declare the attribute", () => {
    expect(
      collectThemeAttributeViolationsForContent(
        "packages/client/app.vue",
        'useHead(() => ({ htmlAttrs: { "data-theme": theme.value } }));',
      ),
    ).toEqual([]);
  });

  test("allows sources that never touch the attribute", () => {
    expect(
      collectThemeAttributeViolationsForContent(
        "packages/client/layouts/default.vue",
        CLEAN_SOURCE,
      ),
    ).toEqual([]);
  });
});
