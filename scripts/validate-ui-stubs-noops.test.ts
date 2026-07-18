import { describe, expect, test } from "bun:test";
import { collectStubNoopViolationsForContent } from "./validate-ui-stubs-noops";

const CONSUMER_PATH = "packages/client/pages/jobs/index.vue";

describe("collectStubNoopViolationsForContent", () => {
  test("flags inert @click="" handler", () => {
    const violations = collectStubNoopViolationsForContent(
      CONSUMER_PATH,
      "<template><button @click=\"\">x</button></template>",
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

  test("flags TODO comment in script", () => {
    const violations = collectStubNoopViolationsForContent(
      CONSUMER_PATH,
      ['<script setup lang="ts">', "// TODO: wire this up", "</script>", "<template><div /></template>"].join("\n"),
    );
    expect(violations.some((v) => v.message.includes("TODO"))).toBe(true);
  });

  test("flags dead CTA button with no handler", () => {
    const violations = collectStubNoopViolationsForContent(
      CONSUMER_PATH,
      '<template><button class="btn">Submit</button></template>',
    );
    expect(violations.some((v) => v.message.includes("Dead CTA"))).toBe(true);
  });

  test("allows wired button with @click", () => {
    const violations = collectStubNoopViolationsForContent(
      CONSUMER_PATH,
      '<template><button class="btn" @click="onSubmit">Submit</button></template>',
    );
    expect(violations).toHaveLength(0);
  });

  test("allows disabled button with no handler", () => {
    const violations = collectStubNoopViolationsForContent(
      CONSUMER_PATH,
      '<template><button class="btn" disabled>Loading</button></template>',
    );
    expect(violations).toHaveLength(0);
  });
});
