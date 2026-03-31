import { describe, expect, test } from "bun:test";
import { collectPageSeoViolationsForContent } from "./validate-page-seo-metadata";

describe("collectPageSeoViolationsForContent", () => {
  test("rejects server-only page SEO metadata", () => {
    const violations = collectPageSeoViolationsForContent(
      "packages/client/pages/example.vue",
      [
        '<script setup lang="ts">',
        "useServerSeoMeta({ title: t('example.seoTitle'), description: t('example.seoDescription') });",
        "</script>",
      ].join("\n"),
    );

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain("useSeoMeta");
  });

  test("accepts hydrated SEO metadata with title and description", () => {
    const violations = collectPageSeoViolationsForContent(
      "packages/client/pages/example.vue",
      [
        '<script setup lang="ts">',
        "useSeoMeta({ title: t('example.seoTitle'), description: t('example.seoDescription') });",
        "</script>",
      ].join("\n"),
    );

    expect(violations).toHaveLength(0);
  });
});
