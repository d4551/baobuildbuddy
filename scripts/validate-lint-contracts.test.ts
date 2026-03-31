import { describe, expect, test } from "bun:test";
import { ROUTE_JOBS } from "../packages/shared/src/constants/routes";
import { collectClientFetchDriftViolationsForContent } from "./validate-no-client-fetch-drift";
import { collectDirectEnvAccessViolationsForContent } from "./validate-no-direct-env-access";
import { collectFallbackShimViolationsForContent } from "./validate-no-fallback-shims";
import { collectHardcodedUserStringViolationsForContent } from "./validate-no-hardcoded-user-strings";
import { collectNoHtmxViolationsForContent } from "./validate-no-htmx";
import { collectPageStateViolationsForContent } from "./validate-page-state-contracts";
import { collectNoTryCatchViolationsForContent } from "./validate-no-try-catch";
import { collectUiSingleSourceViolationsForContent } from "./validate-ui-single-source-of-truth";

describe("collectNoHtmxViolationsForContent", () => {
  test("flags hx attributes in Vue templates", () => {
    const violations = collectNoHtmxViolationsForContent(
      "packages/client/pages/example.vue",
      `<template><button hx-get="${ROUTE_JOBS}">Load</button></template>`,
    );

    expect(violations.some((violation) => violation.message.includes("hx attributes"))).toBe(true);
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
    const violations = collectPageStateViolationsForContent(
      "packages/client/pages/example.vue",
      [
        "<template>",
        `<LoadingSkeleton v-if="uiState === 'loading'" />`,
        `<BootstrapErrorAlert v-else-if="uiState === 'error'" />`,
        `<EmptyState v-else-if="uiState === 'empty'" />`,
        "</template>",
      ].join("\n"),
    );

    expect(violations.some((violation) => violation.message.includes("success"))).toBe(true);
  });

  test("accepts an explicit v-else success branch for alternate state names", () => {
    const violations = collectPageStateViolationsForContent(
      "packages/client/pages/docs.vue",
      [
        "<template>",
        `<LoadingSkeleton v-if="docsUiState === 'loading'" />`,
        `<EmptyState v-else-if="docsUiState === 'empty'" />`,
        `<BootstrapErrorAlert v-else-if="docsUiState === 'errorRetryable' || docsUiState === 'unauthorized'" />`,
        "<section v-else />",
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

    expect(violations.some((violation) => violation.message.includes("Direct environment access"))).toBe(true);
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
