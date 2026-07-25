import { describe, expect, test } from "bun:test";
import { collectDeadDaisyUiV4ViolationsForContent } from "./validate-no-dead-daisyui-v4";

const CONSUMER_PATH = "packages/client/components/example/ExampleWidget.vue";

describe("collectDeadDaisyUiV4ViolationsForContent", () => {
  test("flags btn-group", () => {
    const violations = collectDeadDaisyUiV4ViolationsForContent(
      CONSUMER_PATH,
      '<template><div class="btn-group"></div></template>',
    );
    expect(violations.some((v) => v.message.includes("btn-group"))).toBe(true);
  });

  test("flags input-bordered and form-control", () => {
    const violations = collectDeadDaisyUiV4ViolationsForContent(
      CONSUMER_PATH,
      '<template><div class="form-control"><input class="input input-bordered" /></div></template>',
    );
    expect(violations.some((v) => v.message.includes("form-control"))).toBe(true);
    expect(violations.some((v) => v.message.includes("input-bordered"))).toBe(true);
  });

  test("flags tabs-bordered / tabs-lifted / tabs-boxed", () => {
    const violations = collectDeadDaisyUiV4ViolationsForContent(
      CONSUMER_PATH,
      '<template><div class="tabs tabs-bordered tabs-lifted tabs-boxed"></div></template>',
    );
    expect(violations.some((v) => v.message.includes("tabs-bordered"))).toBe(true);
    expect(violations.some((v) => v.message.includes("tabs-lifted"))).toBe(true);
    expect(violations.some((v) => v.message.includes("tabs-boxed"))).toBe(true);
  });

  test("allows daisyUI v5 join / fieldset / tabs contracts", () => {
    const violations = collectDeadDaisyUiV4ViolationsForContent(
      CONSUMER_PATH,
      '<template><div class="join"><fieldset class="fieldset"><div class="tabs tabs-box"></div></fieldset></div></template>',
    );
    expect(violations).toHaveLength(0);
  });
});
