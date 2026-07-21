import { describe, expect, test } from "bun:test";
import { findDeadKeys } from "./validate-no-dead-i18n-keys";

describe("findDeadKeys", () => {
  test("flags a key with no literal or dynamic consumer (VACUOUS_GATE_TEST)", () => {
    const keys = ["app.tagline", "app.consumed", "dashboard.dynamic.metric"];
    const corpus = ['t("app.consumed")', "t(`dashboard.dynamic.${variable}`)"].join("\n");
    const violations = findDeadKeys(keys, corpus, []);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain("app.tagline");
  });

  test("allows a key consumed via dynamic template prefix", () => {
    const keys = ["apiDocs.state.errorRetryable", "apiDocs.state.loading"];
    const corpus = "t(`apiDocs.state.${docsUiState}`)";
    const violations = findDeadKeys(keys, corpus, []);
    expect(violations).toHaveLength(0);
  });

  test("allows a key consumed via string concatenation prefix", () => {
    const keys = ["jobsPage.options.studioType.aaa"];
    const corpus = 't("jobsPage.options.studioType." + value)';
    const violations = findDeadKeys(keys, corpus, []);
    expect(violations).toHaveLength(0);
  });

  test("allows a key in the allowlist", () => {
    const keys = ["legacy.unused"];
    const allowlist = [
      {
        key: "legacy.unused",
        reason: "Retained for backward compatibility (expiry 2026-12-31).",
      },
    ];
    const violations = findDeadKeys(keys, "", allowlist);
    expect(violations).toHaveLength(0);
  });

  test("flags a key present in corpus but allowlisted with wildcard prefix", () => {
    const keys = ["legacy.a", "legacy.b", "other.dead"];
    const allowlist = [
      {
        key: "legacy.*",
        reason: "Legacy keys retained for plugin compatibility (expiry 2026-12-31).",
      },
    ];
    const violations = findDeadKeys(keys, "", allowlist);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain("other.dead");
  });
});
