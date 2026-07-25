import { describe, expect, it } from "bun:test";
import { collectNavIaViolations } from "./validate-nav-ia";

describe("validate-nav-ia", () => {
  it("passes for the current sidebar source without kbd", () => {
    expect(collectNavIaViolations("<template><nav></nav></template>")).toEqual([]);
  });

  it("fails when sidebar contains kbd chrome", () => {
    const violations = collectNavIaViolations(
      `<template><kbd class="kbd">G</kbd></template>`,
    );
    expect(violations.some((v) => v.message.includes("<kbd>"))).toBe(true);
  });
});
