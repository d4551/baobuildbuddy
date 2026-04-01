import { readFileSync } from "node:fs";
import { describe, expect, test } from "bun:test";
import { collectAccessibilityLandmarkViolationsForContent } from "./validate-accessibility-landmarks";
import { ROUTE_JOBS } from "../packages/shared/src/constants/routes";
import { collectClientFetchDriftViolationsForContent } from "./validate-no-client-fetch-drift";
import { collectDaisyUiContractViolationsForContent } from "./validate-daisyui-contracts";
import { collectDirectEnvAccessViolationsForContent } from "./validate-no-direct-env-access";
import { collectFallbackShimViolationsForContent } from "./validate-no-fallback-shims";
import { collectHardcodedUserStringViolationsForContent } from "./validate-no-hardcoded-user-strings";
import { collectNoHtmxViolationsForContent } from "./validate-no-htmx";
import { collectPageStateViolationsForContent } from "./validate-page-state-contracts";
import { collectNoTryCatchViolationsForContent } from "./validate-no-try-catch";
import { collectUiSingleSourceViolationsForContent } from "./validate-ui-single-source-of-truth";

const BRAND_PREVIEW_FILE_PATH = "packages/client/components/settings/brand/BrandPreviewCard.vue";
const BROKEN_BRAND_PREVIEW_SAMPLE = [
  '<script setup lang="ts">',
  "const createPreviewSurfaceStyle = () => ({ '--brand-preview-base-100': '#fff' });",
  "</script>",
].join("\n");
const VALID_BRAND_PREVIEW_SAMPLE = [
  '<script setup lang="ts">',
  "const createPreviewSurfaceStyle = () => ({",
  "  '--color-base-100': '#fff',",
  "  '--color-base-200': '#f8f8f8',",
  "  '--color-base-300': '#efefef',",
  "  '--color-base-content': '#111',",
  "  '--color-primary': '#1d4ed8',",
  "  '--color-primary-content': '#fff',",
  "  '--color-secondary': '#0f766e',",
  "  '--color-secondary-content': '#fff',",
  "  '--color-accent': '#65a30d',",
  "  '--color-accent-content': '#111',",
  "  '--color-neutral': '#1f2937',",
  "  '--color-neutral-content': '#fff',",
  "  '--color-info': '#0284c7',",
  "  '--color-info-content': '#fff',",
  "  '--color-success': '#15803d',",
  "  '--color-success-content': '#fff',",
  "  '--color-warning': '#f59e0b',",
  "  '--color-warning-content': '#111',",
  "  '--color-error': '#dc2626',",
  "  '--color-error-content': '#fff',",
  "  '--radius-selector': '0.5rem',",
  "  '--radius-field': '0.25rem',",
  "  '--radius-box': '0.75rem',",
  "  '--size-selector': '0.25rem',",
  "  '--size-field': '0.25rem',",
  "  '--border': '1px',",
  "  '--depth': '1',",
  "  '--noise': '0',",
  "});",
  "</script>",
].join("\n");
const PAGE_STATE_EXAMPLE_PATH = "packages/client/pages/example.vue";
const PAGE_STATE_DOCS_PATH = "packages/client/pages/docs.vue";
const PAGE_STATE_MISSING_SUCCESS_SAMPLE = [
  "<template>",
  `<LoadingSkeleton v-if="uiState === 'loading'" />`,
  `<BootstrapErrorAlert v-else-if="uiState === 'error'" />`,
  `<EmptyState v-else-if="uiState === 'empty'" />`,
  "</template>",
].join("\n");
const PAGE_STATE_COMPONENT_SIGNAL_SAMPLE = [
  "<template>",
  '<LoadingSkeleton v-if="pending" />',
  '<BootstrapErrorAlert v-else-if="errorMessage" />',
  '<EmptyState v-else-if="isEmpty" />',
  "</template>",
].join("\n");
const PAGE_STATE_EXPLICIT_EMPTY_SAMPLE = [
  "<template>",
  '<LoadingSkeleton v-if="pending" />',
  '<BootstrapErrorAlert v-else-if="errorMessage" />',
  `<section v-else-if="state === 'empty'"><EmptyState /></section>`,
  '<section v-else><article v-for="item in items" :key="item.id" /></section>',
  "</template>",
].join("\n");
const PAGE_STATE_V_ELSE_SUCCESS_SAMPLE = [
  "<template>",
  `<LoadingSkeleton v-if="docsUiState === 'loading'" />`,
  `<EmptyState v-else-if="docsUiState === 'empty'" />`,
  `<BootstrapErrorAlert v-else-if="docsUiState === 'errorRetryable' || docsUiState === 'unauthorized'" />`,
  "<section v-else />",
  "</template>",
].join("\n");
const ROOT_MANIFEST_TEXT = readFileSync(new URL("../package.json", import.meta.url), "utf8");
const ROOT_MANIFEST = JSON.parse(ROOT_MANIFEST_TEXT) as {
  scripts: Record<string, string>;
};

const collectExamplePageStateViolations = (content: string) =>
  collectPageStateViolationsForContent(PAGE_STATE_EXAMPLE_PATH, content);
const expectMissingPageState = (content: string, missingState: string): void => {
  const violations = collectExamplePageStateViolations(content);

  expect(violations.some((violation) => violation.message.includes(missingState))).toBe(true);
};

const expectNoPageStateViolations = (filePath: string, content: string): void => {
  const violations = collectPageStateViolationsForContent(filePath, content);

  expect(violations).toHaveLength(0);
};

describe("collectNoHtmxViolationsForContent", () => {
  test("flags hx attributes in Vue templates", () => {
    const violations = collectNoHtmxViolationsForContent(
      "packages/client/pages/example.vue",
      `<template><button hx-get="${ROUTE_JOBS}">Load</button></template>`,
    );

    expect(violations.some((violation) => violation.message.includes("hx attributes"))).toBe(true);
  });
});

describe("root lint contract", () => {
  test("keeps htmx, page-state, aria, i18n, and ui single-source validators in the root lint entrypoint", () => {
    const lintScript = ROOT_MANIFEST.scripts.lint;

    expect(lintScript).toContain("validate:no-htmx");
    expect(lintScript).toContain("validate:page-state-contracts");
    expect(lintScript).toContain("validate:aria");
    expect(lintScript).toContain("validate:i18n-ui");
    expect(lintScript).toContain("validate:ui-ssot");
  });

  test("does not use workspace filters in the root manifest", () => {
    expect(ROOT_MANIFEST_TEXT.includes("--filter")).toBe(false);
  });
});

describe("collectNoTryCatchViolationsForContent", () => {
  test("flags promise catch handlers", () => {
    const promiseCatchSample = ["void task", ".", "cat", "ch((error) => report(error));"].join("");
    const violations = collectNoTryCatchViolationsForContent(
      "scripts/example.ts",
      promiseCatchSample,
    );

    expect(violations.some((violation) => violation.message.includes("Promise catch"))).toBe(true);
  });
});

describe("collectUiSingleSourceViolationsForContent", () => {
  test("flags local style blocks in Vue files", () => {
    const violations = collectUiSingleSourceViolationsForContent(
      "packages/client/components/example.vue",
      `<template><div /></template>\n<style scoped>\n.box {}\n</style>`,
    );

    expect(violations.some((violation) => violation.message.includes("<style> blocks"))).toBe(true);
  });

  test("requires shared settings panel headers", () => {
    const violations = collectUiSingleSourceViolationsForContent(
      "packages/client/components/settings/SettingsEmailDeliveryPanel.vue",
      [
        "<template>",
        '<div class="card"><div class="card-body"><div class="flex items-center justify-between gap-3"></div></div></div>',
        "</template>",
      ].join("\n"),
    );

    expect(violations.some((violation) => violation.message.includes("SettingsPanelHeader"))).toBe(
      true,
    );
  });
});

describe("collectUiSingleSourceViolationsForContent settings bootstrap", () => {
  test("flags unguarded settings bootstrap refetches in client composables", () => {
    const violations = collectUiSingleSourceViolationsForContent(
      "packages/client/composables/ai-dashboard-bootstrap.ts",
      [
        "export function useDashboardBootstrap(input: { fetchSettings: () => Promise<void> }) {",
        '  return useAsyncData("ai-dashboard-bootstrap", async () => {',
        "    await input.fetchSettings();",
        "    return true;",
        "  });",
        "}",
      ].join("\n"),
    );

    expect(violations.some((violation) => violation.message.includes("single-source"))).toBe(true);
  });

  test("allows guarded settings bootstrap reuse in client composables", () => {
    const violations = collectUiSingleSourceViolationsForContent(
      "packages/client/composables/ai-dashboard-bootstrap.ts",
      [
        "export function useDashboardBootstrap(input: {",
        "  settings: { value: object | null };",
        "  fetchSettings: () => Promise<void>;",
        "}) {",
        '  return useAsyncData("ai-dashboard-bootstrap", async () => {',
        "    if (!input.settings.value) {",
        "      await input.fetchSettings();",
        "    }",
        "    return true;",
        "  });",
        "}",
      ].join("\n"),
    );

    expect(violations.some((violation) => violation.message.includes("single-source"))).toBe(false);
  });
});

describe("collectDaisyUiContractViolationsForContent", () => {
  test("requires brand previews to scope daisyUI theme variables locally", () => {
    const violations = collectDaisyUiContractViolationsForContent(
      BRAND_PREVIEW_FILE_PATH,
      BROKEN_BRAND_PREVIEW_SAMPLE,
    );

    expect(
      violations.some((violation) => violation.message.includes("Brand preview surfaces")),
    ).toBe(true);
  });

  test("accepts brand previews that scope the full daisyUI theme contract", () => {
    const violations = collectDaisyUiContractViolationsForContent(
      BRAND_PREVIEW_FILE_PATH,
      VALID_BRAND_PREVIEW_SAMPLE,
    );

    expect(violations).toHaveLength(0);
  });
});

describe("collectHardcodedUserStringViolationsForContent", () => {
  test("flags inline toast copy instead of allowing sentence punctuation", () => {
    const violations = collectHardcodedUserStringViolationsForContent(
      "packages/client/composables/example.ts",
      'toast.success("Saved successfully.");',
    );

    expect(violations.some((violation) => violation.message.includes("Toast literal"))).toBe(true);
  });

  test("allows locale keys in metadata and copy fields", () => {
    const violations = collectHardcodedUserStringViolationsForContent(
      "packages/client/pages/example.vue",
      [
        '<script setup lang="ts">',
        "useSeoMeta({ title: 'example.page.title', description: 'example.page.description' });",
        "const modal = { confirmLabel: 'common.confirm', cancelLabel: 'common.cancel' };",
        "</script>",
      ].join("\n"),
    );

    expect(violations).toHaveLength(0);
  });
});

describe("collectPageStateViolationsForContent", () => {
  test("requires a success branch in addition to loading, error, and empty states", () => {
    expectMissingPageState(PAGE_STATE_MISSING_SUCCESS_SAMPLE, "success");
  });

  test("detects page-state contracts from shared state components even without uiState naming", () => {
    expectMissingPageState(PAGE_STATE_COMPONENT_SIGNAL_SAMPLE, "success");
  });
});

describe("collectPageStateViolationsForContent empty state coverage", () => {
  test("requires an explicit empty branch when the page models emptiness via isEmpty", () => {
    expectMissingPageState(
      [
        "<template>",
        '<LoadingSkeleton v-if="pending" />',
        '<BootstrapErrorAlert v-else-if="errorMessage" />',
        '<section v-else-if="isEmpty" />',
        '<section v-else><article v-for="item in items" :key="item.id" /></section>',
        "</template>",
      ].join("\n"),
      "empty",
    );
  });

  test("requires empty states when the page explicitly models emptiness", () => {
    expectNoPageStateViolations(PAGE_STATE_EXAMPLE_PATH, PAGE_STATE_EXPLICIT_EMPTY_SAMPLE);
  });

  test("accepts an explicit v-else success branch for alternate state names", () => {
    expectNoPageStateViolations(PAGE_STATE_DOCS_PATH, PAGE_STATE_V_ELSE_SUCCESS_SAMPLE);
  });
});

describe("accessibility landmark validation", () => {
  test("flags routed pages that omit a labelled scaffold target", () => {
    const violations = collectAccessibilityLandmarkViolationsForContent(
      "packages/client/pages/example.vue",
      [
        "<template>",
        "<PageScaffold>",
        '<PageHeroHeader title-id="example-page-title" :title="t(\'example.title\')" />',
        "</PageScaffold>",
        "</template>",
      ].join("\n"),
    );

    expect(violations.some((violation) => violation.message.includes("labelled-by"))).toBe(true);
  });

  test("flags routed pages that attempt to declare their own main landmark", () => {
    const violations = collectAccessibilityLandmarkViolationsForContent(
      "packages/client/pages/example.vue",
      [
        "<template>",
        '<PageScaffold tag="main" labelled-by="example-page-title">',
        '<h1 id="example-page-title">{{ t("example.title") }}</h1>',
        "</PageScaffold>",
        "</template>",
      ].join("\n"),
    );

    expect(violations.some((violation) => violation.message.includes("single main landmark"))).toBe(
      true,
    );
  });

  test("accepts routed pages with a labelled scaffold that matches the shared heading id", () => {
    const violations = collectAccessibilityLandmarkViolationsForContent(
      "packages/client/pages/example.vue",
      [
        "<template>",
        '<PageScaffold labelled-by="example-page-title">',
        '<PageHeroHeader title-id="example-page-title" :title="t(\'example.title\')" />',
        "</PageScaffold>",
        "</template>",
      ].join("\n"),
    );

    expect(violations).toHaveLength(0);
  });
});

describe("collectClientFetchDriftViolationsForContent", () => {
  test("flags direct generic $fetch calls outside the approved API boundary", () => {
    const violations = collectClientFetchDriftViolationsForContent(
      "packages/client/pages/example.vue",
      `<script setup lang="ts">await $fetch<unknown>("${ROUTE_JOBS}");</script>`,
    );

    expect(violations.some((violation) => violation.message.includes("shared API boundary"))).toBe(
      true,
    );
  });

  test("allows direct fetch helpers inside the shared API request boundary", () => {
    const violations = collectClientFetchDriftViolationsForContent(
      "packages/client/composables/api-request.ts",
      `return $fetch<unknown>("${ROUTE_JOBS}");`,
    );

    expect(violations).toHaveLength(0);
  });
});

describe("collectDirectEnvAccessViolationsForContent", () => {
  test("flags direct env reads outside config and test files", () => {
    const violations = collectDirectEnvAccessViolationsForContent(
      "packages/server/src/services/example.ts",
      "const enabled = Bun.env.BAO_FLAG === '1';",
    );

    expect(
      violations.some((violation) => violation.message.includes("Direct environment access")),
    ).toBe(true);
  });

  test("allows env reads inside config modules", () => {
    const violations = collectDirectEnvAccessViolationsForContent(
      "packages/server/src/config/example.ts",
      "const enabled = Bun.env.BAO_FLAG === '1';",
    );

    expect(violations).toHaveLength(0);
  });
});

describe("collectFallbackShimViolationsForContent", () => {
  test("flags plural fallback terms such as adapters", () => {
    const violations = collectFallbackShimViolationsForContent(
      "packages/scraper/src/job-apply/example.ts",
      'import { resolveJobApplyStrategy } from "./adapters";',
    );

    expect(violations.some((violation) => violation.message.includes("adapters"))).toBe(true);
  });

  test("allows explicitly disabled polyfill configuration", () => {
    const violations = collectFallbackShimViolationsForContent(
      "packages/client/nuxt.config.ts",
      "vite: { resolve: { alias: [] }, build: { polyfill: false } }",
    );

    expect(violations).toHaveLength(0);
  });
});
