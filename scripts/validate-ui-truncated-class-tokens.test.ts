import { describe, expect, test } from "bun:test";
import {
  collectTruncatedClassTokenViolationsForContent,
  isTruncatedClassToken,
} from "./validate-ui-truncated-class-tokens";

const CONSUMER = "packages/client/components/ui/WorkspaceSectionNavigator.vue";

describe("isTruncatedClassToken", () => {
  test("flags lone max-/min-/xl:/print:", () => {
    expect(isTruncatedClassToken("max-")).toBe(true);
    expect(isTruncatedClassToken("min-")).toBe(true);
    expect(isTruncatedClassToken("xl:")).toBe(true);
    expect(isTruncatedClassToken("print:")).toBe(true);
    expect(isTruncatedClassToken("w-")).toBe(true);
  });

  test("allows complete utilities", () => {
    expect(isTruncatedClassToken("max-w-full")).toBe(false);
    expect(isTruncatedClassToken("min-h-0")).toBe(false);
    expect(isTruncatedClassToken("xl:flex")).toBe(false);
    expect(isTruncatedClassToken("print:p-0")).toBe(false);
    expect(isTruncatedClassToken("w-full")).toBe(false);
  });
});

describe("collectTruncatedClassTokenViolationsForContent", () => {
  test("flags truncated tokens in class attributes", () => {
    const violations = collectTruncatedClassTokenViolationsForContent(
      CONSUMER,
      '<template><div class="card max- overflow-x-clip xl:"></div></template>',
    );
    expect(violations.length).toBeGreaterThanOrEqual(2);
    expect(violations.some((v) => v.message.includes('"max-"'))).toBe(true);
    expect(violations.some((v) => v.message.includes('"xl:"'))).toBe(true);
  });

  test("flags :class binding truncated tokens", () => {
    const violations = collectTruncatedClassTokenViolationsForContent(
      CONSUMER,
      `<template><div :class="'min- glass-subtle'"></div></template>`,
    );
    expect(violations.some((v) => v.message.includes('"min-"'))).toBe(true);
  });

  test("passes clean class lists", () => {
    const violations = collectTruncatedClassTokenViolationsForContent(
      CONSUMER,
      '<template><div class="flex min-h-0 max-w-full xl:grow-0"></div></template>',
    );
    expect(violations).toHaveLength(0);
  });

  test("ignores Vue object-syntax :class keys (not truncated utilities)", () => {
    const violations = collectTruncatedClassTokenViolationsForContent(
      CONSUMER,
      `<template><div :class="{ 'btn-primary': on, 'btn-ghost': !on, 'tab-active': active }"></div></template>`,
    );
    expect(violations).toHaveLength(0);
  });

  test("scans authority paths too — no allowlist", () => {
    const violations = collectTruncatedClassTokenViolationsForContent(
      "packages/client/constants/layout.ts",
      // not a vue template — no violations from non-template
      'export const X = "max-";',
    );
    expect(violations).toHaveLength(0);
  });
});
