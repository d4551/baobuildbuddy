import { describe, expect, test } from "bun:test";
import type { Page } from "playwright";
import {
  detectAndFollowHostedApplyPage,
  isHostedApplyErrorUrl,
  resolveJobApplyRunOutcome,
} from "./runtime-page-setup";

const buildPage = (input: {
  url: string;
  href?: string | null;
  count?: number;
  gotoRejects?: boolean;
}): Page => {
  const count = input.count ?? (input.href ? 1 : 0);
  const locator = {
    first: () => locator,
    count: () => Promise.resolve(count),
    getAttribute: () => Promise.resolve(input.href ?? null),
  };
  return {
    url: () => input.url,
    locator: () => locator,
    goto: () => {
      if (input.gotoRejects) {
        return Promise.reject(new Error("nav failed"));
      }
      return Promise.resolve(null);
    },
    waitForLoadState: () => Promise.resolve(undefined),
  } as unknown as Page;
};

describe("detectAndFollowHostedApplyPage", () => {
  test("already_hosted when URL is Greenhouse/Lever", async () => {
    const outcome = await detectAndFollowHostedApplyPage(
      buildPage({ url: "https://boards.greenhouse.io/studio/jobs/1" }),
    );
    expect(outcome).toEqual({
      kind: "already_hosted",
      url: "https://boards.greenhouse.io/studio/jobs/1",
    });
  });

  test("followed when listing exposes hosted apply href", async () => {
    const page = buildPage({
      url: "https://example.com/careers/gameplay",
      href: "https://jobs.lever.co/studio/abc",
    });
    const outcome = await detectAndFollowHostedApplyPage(page);
    expect(outcome.kind).toBe("followed");
  });

  test("no_link when no apply anchor exists", async () => {
    const outcome = await detectAndFollowHostedApplyPage(
      buildPage({ url: "https://example.com/careers/gameplay", count: 0 }),
    );
    expect(outcome).toEqual({
      kind: "no_link",
      url: "https://example.com/careers/gameplay",
    });
  });

  test("nav_failed when hosted apply navigation rejects", async () => {
    const outcome = await detectAndFollowHostedApplyPage(
      buildPage({
        url: "https://example.com/careers/gameplay",
        href: "https://boards.greenhouse.io/studio/jobs/9",
        gotoRejects: true,
      }),
    );
    expect(outcome.kind).toBe("nav_failed");
    if (outcome.kind === "nav_failed") {
      expect(outcome.href).toContain("greenhouse");
    }
  });
});

describe("job-apply honesty gates", () => {
  test("isHostedApplyErrorUrl detects Greenhouse error landings", () => {
    expect(isHostedApplyErrorUrl("https://job-boards.greenhouse.io/discord?error=true")).toBe(
      true,
    );
    expect(isHostedApplyErrorUrl("https://job-boards.greenhouse.io/discord/jobs/1")).toBe(false);
  });

  test("resolveJobApplyRunOutcome fails closed on critical step errors", () => {
    expect(
      resolveJobApplyRunOutcome([
        { action: "fill_name", status: "ok" },
        { action: "fill_email", status: "error", message: "Email field not found" },
        { action: "verify", status: "ok", message: "Submission confirmation detected" },
      ]),
    ).toEqual({ success: false, error: "Email field not found" });

    expect(
      resolveJobApplyRunOutcome([
        { action: "fill_name", status: "ok" },
        { action: "fill_email", status: "ok" },
        { action: "upload_resume", status: "ok" },
        { action: "submit", status: "ok" },
        { action: "verify", status: "ok", message: "Submission confirmation detected" },
      ]),
    ).toEqual({ success: true, error: null });
  });
});
