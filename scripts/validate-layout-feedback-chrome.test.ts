import { describe, expect, test } from "bun:test";
import {
  collectLayoutFeedbackChromeViolations,
  collectMissingLayoutChrome,
} from "./validate-layout-feedback-chrome";

const MOUNTED_LAYOUT = `<template>
  <main>
    <slot />
    <ToastContainer />
  </main>
</template>`;

const BARE_LAYOUT = `<template>
  <main>
    <slot />
  </main>
</template>`;

describe("collectMissingLayoutChrome", () => {
  test("passes a layout that mounts the toast host", () => {
    expect(
      collectMissingLayoutChrome([{ filePath: "layouts/auth-shell.vue", content: MOUNTED_LAYOUT }]),
    ).toEqual([]);
  });

  test("flags a layout that omits the toast host", () => {
    const violations = collectMissingLayoutChrome([
      { filePath: "layouts/auth-shell.vue", content: BARE_LAYOUT },
    ]);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.filePath).toBe("layouts/auth-shell.vue");
    expect(violations[0]?.message).toContain("does not mount <ToastContainer>");
  });

  test("accepts the Nuxt Lazy-prefixed mount", () => {
    expect(
      collectMissingLayoutChrome([
        { filePath: "layouts/default.vue", content: "<template><LazyToastContainer /></template>" },
      ]),
    ).toEqual([]);
  });

  test("accepts a paired (non-self-closing) mount", () => {
    expect(
      collectMissingLayoutChrome([
        {
          filePath: "layouts/default.vue",
          content: "<template><ToastContainer></ToastContainer></template>",
        },
      ]),
    ).toEqual([]);
  });

  test("does not treat a same-prefix component as the toast host", () => {
    const violations = collectMissingLayoutChrome([
      {
        filePath: "layouts/default.vue",
        content: "<template><ToastContainerHeading /></template>",
      },
    ]);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain("does not mount <ToastContainer>");
  });

  test("reports every offending layout, not just the first", () => {
    const violations = collectMissingLayoutChrome([
      { filePath: "layouts/a.vue", content: BARE_LAYOUT },
      { filePath: "layouts/b.vue", content: MOUNTED_LAYOUT },
      { filePath: "layouts/c.vue", content: BARE_LAYOUT },
    ]);
    expect(violations.map((violation) => violation.filePath)).toEqual([
      "layouts/a.vue",
      "layouts/c.vue",
    ]);
  });

  test("fails closed on empty input instead of vacuously passing", () => {
    const violations = collectMissingLayoutChrome([]);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain("would silently pass");
  });
});

describe("collectLayoutFeedbackChromeViolations against the real layouts", () => {
  test("every on-disk layout mounts the shared toast host", async () => {
    expect(await collectLayoutFeedbackChromeViolations()).toEqual([]);
  });
});
