import { describe, expect, test } from "bun:test";
import { collectDaisyUiContractViolationsForContent } from "./validate-daisyui-contracts";

describe("collectDaisyUiContractViolationsForContent", () => {
  test("flags tailwind bullet classes mixed into daisyUI list markup", () => {
    const violations = collectDaisyUiContractViolationsForContent(
      "packages/client/pages/example.vue",
      `<template><ul class="list list-disc list-inside"><li class="list-row">Item</li></ul></template>`,
    );

    expect(violations.some((violation) => violation.message.includes("Tailwind bullet-list"))).toBe(
      true,
    );
  });

  test("flags btn without semantic modifier", () => {
    const violations = collectDaisyUiContractViolationsForContent(
      "packages/client/pages/example.vue",
      `<template><button class="btn btn-sm">Click</button></template>`,
    );

    expect(violations.some((v) => v.message.includes("btn") && v.message.includes("modifier"))).toBe(
      true,
    );
  });

  test("passes btn with semantic modifier", () => {
    const violations = collectDaisyUiContractViolationsForContent(
      "packages/client/pages/example.vue",
      `<template><button class="btn btn-sm btn-ghost">Click</button></template>`,
    );

    expect(violations.some((v) => v.message.includes("btn") && v.message.includes("modifier"))).toBe(
      false,
    );
  });
});
