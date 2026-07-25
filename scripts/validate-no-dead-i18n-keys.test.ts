import { describe, expect, test } from "bun:test";
import { findDeadKeys } from "./validate-no-dead-i18n-keys";

const TODAY = "2026-07-24";

describe("findDeadKeys consumers", () => {
  test("flags a key with no literal or dynamic consumer (VACUOUS_GATE_TEST)", () => {
    const keys = ["app.tagline", "app.consumed", "dashboard.dynamic.metric"];
    const corpus = ['t("app.consumed")', `t(\`dashboard.dynamic.\${variable}\`)`].join("\n");
    const violations = findDeadKeys(keys, corpus, [], TODAY);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain("app.tagline");
  });

  test("flags a key that only appears unquoted (comment/prose does not count)", () => {
    const keys = ["app.tagline"];
    const corpus = "// shows app.tagline near the footer\nconst x = app.taglineish;";
    const violations = findDeadKeys(keys, corpus, [], TODAY);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain("app.tagline");
  });

  test("does not let a key ride on being a substring of a longer literal", () => {
    const keys = ["jobs.saved"];
    const corpus = 't("jobs.savedJobsEmpty")';
    const violations = findDeadKeys(keys, corpus, [], TODAY);
    expect(violations).toHaveLength(1);
  });

  test("allows a key consumed via dynamic template prefix", () => {
    const keys = ["apiDocs.state.errorRetryable", "apiDocs.state.loading"];
    const corpus = `t(\`apiDocs.state.\${docsUiState}\`)`;
    const violations = findDeadKeys(keys, corpus, [], TODAY);
    expect(violations).toHaveLength(0);
  });

  test("allows a key consumed via string concatenation prefix", () => {
    const keys = ["jobsPage.options.studioType.aaa"];
    const corpus = 't("jobsPage.options.studioType." + value)';
    const violations = findDeadKeys(keys, corpus, [], TODAY);
    expect(violations).toHaveLength(0);
  });
});

describe("findDeadKeys allowlist", () => {
  test("allows an exact key in the allowlist with a future expires date", () => {
    const keys = ["legacy.unused"];
    const allowlist = [
      {
        key: "legacy.unused",
        reason: "Retained for backward compatibility.",
        expires: "2026-12-31",
      },
    ];
    const violations = findDeadKeys(keys, "", allowlist, TODAY);
    expect(violations).toHaveLength(0);
  });

  test("fails an exact-key allowlist entry without expires", () => {
    const allowlist = [{ key: "legacy.unused", reason: "No date given." }];
    const violations = findDeadKeys([], "", allowlist, TODAY);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain("expires");
  });

  test("fails an expired allowlist entry", () => {
    const allowlist = [
      { key: "legacy.unused", reason: "Should be resolved by now.", expires: "2026-07-01" },
    ];
    const violations = findDeadKeys([], "", allowlist, TODAY);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain("expired");
  });

  test("fails a stale allowlist entry whose key is now literally consumed", () => {
    const allowlist = [{ key: "jobs.saved", reason: "Consumer wired.", expires: "2026-12-31" }];
    const violations = findDeadKeys([], 't("jobs.saved")', allowlist, TODAY);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain("Stale allowlist entry");
  });

  test("fails duplicate allowlist entries", () => {
    const allowlist = [
      { key: "legacy.a", reason: "First.", expires: "2026-12-31" },
      { key: "legacy.a", reason: "Second.", expires: "2026-12-31" },
    ];
    const violations = findDeadKeys([], "", allowlist, TODAY);
    expect(violations.some((v) => v.message.includes("Duplicate"))).toBe(true);
  });

  test("wildcard prefix entries do not require expires and still shield keys", () => {
    const keys = ["legacy.a", "legacy.b", "other.dead"];
    const allowlist = [
      {
        key: "legacy.*",
        reason: "Legacy keys retained for plugin compatibility.",
      },
    ];
    const violations = findDeadKeys(keys, "", allowlist, TODAY);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain("other.dead");
  });
});
