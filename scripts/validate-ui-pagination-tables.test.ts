import { describe, expect, test } from "bun:test";
import { collectPaginationTableViolationsForContent } from "./validate-ui-pagination-tables";

const CONSUMER_PATH = "packages/client/pages/jobs/index.vue";

describe("collectPaginationTableViolationsForContent", () => {
  test("flags hand-rolled pagination v-for", () => {
    const violations = collectPaginationTableViolationsForContent(
      CONSUMER_PATH,
      '<template><nav><button v-for="page in totalPages" :key="page">{{ page }}</button></nav></template>',
    );
    expect(violations.some((v) => v.message.includes("AppPagination"))).toBe(true);
  });

  test("allows AppPagination primitive usage", () => {
    const violations = collectPaginationTableViolationsForContent(
      CONSUMER_PATH,
      '<template><AppPagination :total="10" /></template>',
    );
    expect(violations).toHaveLength(0);
  });

  test("flags raw <table> without class=table", () => {
    const violations = collectPaginationTableViolationsForContent(
      CONSUMER_PATH,
      "<template><table><tbody><tr><td>x</td></tr></tbody></table></template>",
    );
    expect(violations.some((v) => v.message.includes('class="table"'))).toBe(true);
  });

  test("flags table with class=table but no overflow-x-auto wrapper", () => {
    const violations = collectPaginationTableViolationsForContent(
      CONSUMER_PATH,
      '<template><div><table class="table"><tbody><tr><td>x</td></tr></tbody></table></div></template>',
    );
    expect(violations.some((v) => v.message.includes("overflow-x-auto"))).toBe(true);
  });

  test("allows table with class=table inside overflow-x-auto wrapper", () => {
    const violations = collectPaginationTableViolationsForContent(
      CONSUMER_PATH,
      '<template><div class="overflow-x-auto"><table class="table"><tbody><tr><td>x</td></tr></tbody></table></div></template>',
    );
    expect(violations).toHaveLength(0);
  });

  test("flags wide table-zebra without mobile card dual-surface", () => {
    const violations = collectPaginationTableViolationsForContent(
      CONSUMER_PATH,
      '<template><div class="overflow-x-auto"><table class="table table-zebra"><tbody><tr><td>x</td></tr></tbody></table></div></template>',
    );
    expect(violations.some((v) => v.message.includes("dual-surface"))).toBe(true);
  });

  test("allows wide table-zebra inside ResponsiveDataSurface", () => {
    const violations = collectPaginationTableViolationsForContent(
      CONSUMER_PATH,
      `<script setup>
import ResponsiveDataSurface from "~/components/ui/ResponsiveDataSurface.vue";
</script>
<template>
  <ResponsiveDataSurface>
    <template #cards><div>card</div></template>
    <template #table>
      <table class="table table-zebra"><tbody><tr><td>x</td></tr></tbody></table>
    </template>
  </ResponsiveDataSurface>
</template>`,
    );
    expect(violations).toHaveLength(0);
  });
});
