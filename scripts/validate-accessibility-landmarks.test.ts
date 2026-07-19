import { describe, expect, test } from "bun:test";
import { collectAccessibilityLandmarkViolationsForContent } from "./validate-accessibility-landmarks";

const LAYOUT_PATH = "packages/client/layouts/default.vue";
const ERROR_PAGE_PATH = "packages/client/error.vue";

describe("collectAccessibilityLandmarkViolationsForContent", () => {
  test("flags layout skip-link target <main> without tabindex=-1", () => {
    const content = [
      "<template>",
      '  <a href="#main-content" class="sr-only skip-link focus:not-sr-only">Skip</a>',
      '  <main id="main-content" class="flex flex-1 flex-col">',
      "    <slot />",
      "  </main>",
      "</template>",
    ].join("\n");
    const violations = collectAccessibilityLandmarkViolationsForContent(LAYOUT_PATH, content);
    expect(violations.some((v) => v.message.includes('tabindex="-1"'))).toBe(true);
  });

  test("passes layout skip-link target <main> with tabindex=-1", () => {
    const content = [
      "<template>",
      '  <a href="#main-content" class="sr-only skip-link focus:not-sr-only">Skip</a>',
      '  <main id="main-content" tabindex="-1" class="flex flex-1 flex-col">',
      "    <slot />",
      "  </main>",
      "</template>",
    ].join("\n");
    const violations = collectAccessibilityLandmarkViolationsForContent(LAYOUT_PATH, content);
    expect(violations.some((v) => v.message.includes("tabindex"))).toBe(false);
  });

  test("flags error page without a main landmark", () => {
    const content = ["<template>", '  <div class="hero">Error</div>', "</template>"].join("\n");
    const violations = collectAccessibilityLandmarkViolationsForContent(ERROR_PAGE_PATH, content);
    expect(violations.some((v) => v.message.includes("exactly one <main>"))).toBe(true);
  });

  test("flags error page without a skip link", () => {
    const content = [
      "<template>",
      '  <main id="main-content" tabindex="-1">Error</main>',
      "</template>",
    ].join("\n");
    const violations = collectAccessibilityLandmarkViolationsForContent(ERROR_PAGE_PATH, content);
    expect(violations.some((v) => v.message.includes("skip link"))).toBe(true);
  });

  test("passes error page with skip link + main landmark + tabindex=-1", () => {
    const content = [
      "<template>",
      '  <a href="#main-content" class="sr-only skip-link focus:not-sr-only">Skip</a>',
      '  <main id="main-content" tabindex="-1">Error</main>',
      "</template>",
    ].join("\n");
    const violations = collectAccessibilityLandmarkViolationsForContent(ERROR_PAGE_PATH, content);
    expect(violations).toEqual([]);
  });

  test("flags error page skip-link target without tabindex=-1", () => {
    const content = [
      "<template>",
      '  <a href="#main-content" class="sr-only skip-link focus:not-sr-only">Skip</a>',
      '  <main id="main-content">Error</main>',
      "</template>",
    ].join("\n");
    const violations = collectAccessibilityLandmarkViolationsForContent(ERROR_PAGE_PATH, content);
    expect(violations.some((v) => v.message.includes('tabindex="-1"'))).toBe(true);
  });
});
