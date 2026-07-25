import { describe, expect, test } from "bun:test";
import { collectHrefHashStubViolationsForContent } from "./validate-no-href-hash-stubs";

const CONSUMER_PATH = "packages/client/components/example/ExampleWidget.vue";

describe("collectHrefHashStubViolationsForContent", () => {
  test('flags href="#"', () => {
    const violations = collectHrefHashStubViolationsForContent(
      CONSUMER_PATH,
      '<template><a href="#">x</a></template>',
    );
    expect(violations.some((v) => v.message.includes('href="#"'))).toBe(true);
  });

  test("flags javascript:void stubs", () => {
    const violations = collectHrefHashStubViolationsForContent(
      CONSUMER_PATH,
      '<template><a href="javascript:void(0)">x</a></template>',
    );
    expect(violations.some((v) => v.message.includes("javascript:void"))).toBe(true);
  });

  test("allows real routes and hash fragment ids", () => {
    const violations = collectHrefHashStubViolationsForContent(
      CONSUMER_PATH,
      '<template><a href="/jobs">jobs</a><a href="#main-content">skip</a></template>',
    );
    expect(violations).toHaveLength(0);
  });
});
