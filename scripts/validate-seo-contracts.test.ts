import { describe, expect, test } from "bun:test";
import { collectSeoContractViolationsForContent } from "./validate-seo-contracts";

describe("collectSeoContractViolationsForContent", () => {
  test("requires useSeoMeta for client and server title parity", () => {
    const violations = collectSeoContractViolationsForContent(
      "packages/client/pages/example.vue",
      [
        '<script setup lang="ts">',
        "useServerSeoMeta({ title: 'example.page.title', description: 'example.page.description' });",
        "</script>",
      ].join("\n"),
    );

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain("useSeoMeta");
  });

  test("accepts useSeoMeta with title and description", () => {
    const violations = collectSeoContractViolationsForContent(
      "packages/client/pages/example.vue",
      [
        '<script setup lang="ts">',
        "useSeoMeta({ title: 'example.page.title', description: 'example.page.description' });",
        "</script>",
      ].join("\n"),
    );

    expect(violations).toHaveLength(0);
  });
});
