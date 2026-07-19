import { describe, expect, test } from "bun:test";
import {
  collectAbsPathSymlinkViolationsFromEntries,
  collectTrackedSymlinkEntriesFromGitLsFiles,
  isForbiddenAbsUserHomeSymlinkTarget,
} from "./validate-no-abs-path-symlinks";

describe("isForbiddenAbsUserHomeSymlinkTarget", () => {
  test("flags macOS user-home absolute targets", () => {
    expect(
      isForbiddenAbsUserHomeSymlinkTarget(
        "/Users/brandondonnelly/Downloads/baobuildbuddy/packages/client/.output/public",
      ),
    ).toBe(true);
  });

  test("flags Linux user-home absolute targets", () => {
    expect(isForbiddenAbsUserHomeSymlinkTarget("/home/ubuntu/.cache/foo")).toBe(true);
  });

  test("allows relative symlink targets", () => {
    expect(isForbiddenAbsUserHomeSymlinkTarget("../.output/public")).toBe(false);
  });

  test("allows non-home absolute targets used by CI runners only when not under /Users or /home", () => {
    expect(isForbiddenAbsUserHomeSymlinkTarget("/opt/build/output")).toBe(false);
  });
});

describe("collectAbsPathSymlinkViolationsFromEntries", () => {
  test("emits a violation for the tracked client dist host path", () => {
    const violations = collectAbsPathSymlinkViolationsFromEntries([
      {
        filePath: "packages/client/dist",
        target: "/Users/brandondonnelly/Downloads/baobuildbuddy/packages/client/.output/public",
      },
    ]);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.filePath).toBe("packages/client/dist");
    expect(violations[0]?.message).toContain("/Users/");
  });

  test("softening regression: relative targets never violate", () => {
    const violations = collectAbsPathSymlinkViolationsFromEntries([
      { filePath: "packages/client/dist", target: "../.output/public" },
    ]);
    expect(violations).toHaveLength(0);
  });
});

describe("collectTrackedSymlinkEntriesFromGitLsFiles", () => {
  test("parses mode 120000 entries and resolves working-tree targets", async () => {
    const gitLs = [
      "100644 abcdef0123456789abcdef0123456789abcdef01 0\tREADME.md",
      "120000 bee82e0177f906ce66e110766c792d30df584b29 0\tpackages/client/dist",
    ].join("\n");
    const entries = await collectTrackedSymlinkEntriesFromGitLsFiles(gitLs, async (filePath) => {
      if (filePath === "packages/client/dist") {
        return "/Users/example/project/packages/client/.output/public";
      }
      return null;
    });
    expect(entries).toEqual([
      {
        filePath: "packages/client/dist",
        target: "/Users/example/project/packages/client/.output/public",
      },
    ]);
  });
});
