import { describe, expect, test } from "bun:test";
import {
  detectAndFollowHostedApplyPage,
  type ApplyLinkPagePort,
} from "./runtime-follow-apply-link";
import { isHostedApplyErrorUrl, resolveJobApplyRunOutcome } from "./runtime-page-setup";

const buildPage = (input: {
  url: string;
  href?: string | null;
  count?: number;
  gotoRejects?: boolean;
  countRejects?: boolean;
  hrefRejects?: boolean;
}): ApplyLinkPagePort & { gotoCalls: string[] } => {
  const count = input.count ?? (input.href !== undefined ? 1 : 0);
  const gotoCalls: string[] = [];
  const locator = {
    first: () => locator,
    count: () =>
      input.countRejects ? Promise.reject(new Error("count failed")) : Promise.resolve(count),
    getAttribute: () =>
      input.hrefRejects
        ? Promise.reject(new Error("attr failed"))
        : Promise.resolve(input.href ?? null),
  };
  return {
    gotoCalls,
    url: () => input.url,
    locator: () => locator,
    goto: (url: string) => {
      gotoCalls.push(url);
      if (input.gotoRejects) {
        return Promise.reject(new Error("nav failed"));
      }
      return Promise.resolve(null);
    },
    waitForLoadState: () => Promise.resolve(undefined),
  };
};

describe("detectAndFollowHostedApplyPage hosted detection", () => {
  test("already_hosted when URL is Greenhouse", async () => {
    const outcome = await detectAndFollowHostedApplyPage(
      buildPage({ url: "https://boards.greenhouse.io/studio/jobs/1" }),
    );
    expect(outcome).toEqual({
      kind: "already_hosted",
      url: "https://boards.greenhouse.io/studio/jobs/1",
    });
  });

  test("already_hosted when URL is Lever", async () => {
    const outcome = await detectAndFollowHostedApplyPage(
      buildPage({ url: "https://jobs.lever.co/studio/abc" }),
    );
    expect(outcome).toEqual({
      kind: "already_hosted",
      url: "https://jobs.lever.co/studio/abc",
    });
  });

  test("followed when listing exposes hosted apply href and goto receives that href", async () => {
    const page = buildPage({
      url: "https://example.com/careers/gameplay",
      href: "https://jobs.lever.co/studio/abc",
    });
    const outcome = await detectAndFollowHostedApplyPage(page);
    expect(outcome.kind).toBe("followed");
    expect(page.gotoCalls).toEqual(["https://jobs.lever.co/studio/abc"]);
  });

  test("followed for greenhouse href", async () => {
    const page = buildPage({
      url: "https://example.com/careers",
      href: "https://boards.greenhouse.io/studio/jobs/42",
    });
    const outcome = await detectAndFollowHostedApplyPage(page);
    expect(outcome.kind).toBe("followed");
    expect(page.gotoCalls).toEqual(["https://boards.greenhouse.io/studio/jobs/42"]);
  });
});

describe("detectAndFollowHostedApplyPage no-link and failure paths", () => {
  test("no_link when no apply anchor exists", async () => {
    const outcome = await detectAndFollowHostedApplyPage(
      buildPage({ url: "https://example.com/careers/gameplay", count: 0 }),
    );
    expect(outcome).toEqual({
      kind: "no_link",
      url: "https://example.com/careers/gameplay",
    });
  });

  test("no_link when href is not a known hosted apply page", async () => {
    const page = buildPage({
      url: "https://example.com/careers",
      href: "https://example.com/about-us",
    });
    const outcome = await detectAndFollowHostedApplyPage(page);
    expect(outcome).toEqual({ kind: "no_link", url: "https://example.com/careers" });
    expect(page.gotoCalls).toEqual([]);
  });

  test("no_link when href is null", async () => {
    const outcome = await detectAndFollowHostedApplyPage(
      buildPage({ url: "https://example.com/careers", href: null }),
    );
    expect(outcome).toEqual({ kind: "no_link", url: "https://example.com/careers" });
  });

  test("no_link when count() rejects", async () => {
    const outcome = await detectAndFollowHostedApplyPage(
      buildPage({ url: "https://example.com/careers", countRejects: true }),
    );
    expect(outcome).toEqual({ kind: "no_link", url: "https://example.com/careers" });
  });

  test("no_link when getAttribute rejects", async () => {
    const outcome = await detectAndFollowHostedApplyPage(
      buildPage({ url: "https://example.com/careers", hrefRejects: true }),
    );
    expect(outcome).toEqual({ kind: "no_link", url: "https://example.com/careers" });
  });

  test("nav_failed when hosted apply navigation rejects and carries href", async () => {
    const outcome = await detectAndFollowHostedApplyPage(
      buildPage({
        url: "https://example.com/careers/gameplay",
        href: "https://boards.greenhouse.io/studio/jobs/9",
        gotoRejects: true,
      }),
    );
    expect(outcome.kind).toBe("nav_failed");
    if (outcome.kind === "nav_failed") {
      expect(outcome.href).toBe("https://boards.greenhouse.io/studio/jobs/9");
      expect(outcome.url).toBe("https://example.com/careers/gameplay");
    }
  });
});

describe("isHostedApplyErrorUrl", () => {
  test("detects Greenhouse error query param", () => {
    expect(isHostedApplyErrorUrl("https://job-boards.greenhouse.io/discord?error=true")).toBe(true);
  });

  test("passes valid job posting URL", () => {
    expect(isHostedApplyErrorUrl("https://job-boards.greenhouse.io/discord/jobs/1")).toBe(false);
  });

  test("detects /error path segment", () => {
    expect(isHostedApplyErrorUrl("https://example.com/error/something")).toBe(true);
  });

  test("detects /404 path suffix", () => {
    expect(isHostedApplyErrorUrl("https://example.com/page/404")).toBe(true);
  });

  test("detects error=true in unparseable URL via fallback regex", () => {
    expect(isHostedApplyErrorUrl("not a url ?error=true")).toBe(true);
  });

  test("passes unparseable URL without error marker", () => {
    expect(isHostedApplyErrorUrl("not a url at all")).toBe(false);
  });
});

describe("resolveJobApplyRunOutcome", () => {
  test("fails closed on critical step error even when later steps succeed", () => {
    expect(
      resolveJobApplyRunOutcome([
        { action: "fill_name", status: "ok" },
        { action: "fill_email", status: "error", message: "Email field not found" },
        { action: "verify", status: "ok", message: "Submission confirmation detected" },
      ]),
    ).toEqual({ success: false, error: "Email field not found" });
  });

  test("succeeds when all critical steps pass", () => {
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

  test("fails closed on non-critical step error", () => {
    expect(
      resolveJobApplyRunOutcome([
        { action: "fill_name", status: "ok" },
        { action: "fill_cover_letter", status: "error", message: "Cover letter too long" },
        { action: "submit", status: "ok" },
      ]),
    ).toEqual({ success: false, error: "Cover letter too long" });
  });

  test("fails closed with generated message when error has no message", () => {
    expect(resolveJobApplyRunOutcome([{ action: "submit", status: "error" }])).toEqual({
      success: false,
      error: "Job apply failed at submit",
    });
  });

  test("succeeds with skipped non-critical steps", () => {
    expect(
      resolveJobApplyRunOutcome([
        { action: "follow_apply_link", status: "skipped" },
        { action: "fill_name", status: "ok" },
        { action: "submit", status: "ok" },
        { action: "verify", status: "ok" },
      ]),
    ).toEqual({ success: true, error: null });
  });

  test("succeeds with empty step ledger (no errors to report)", () => {
    expect(resolveJobApplyRunOutcome([])).toEqual({ success: true, error: null });
  });

  test("reports first critical error when multiple critical steps fail", () => {
    expect(
      resolveJobApplyRunOutcome([
        { action: "fill_name", status: "error", message: "Name missing" },
        { action: "fill_email", status: "error", message: "Email missing" },
      ]),
    ).toEqual({ success: false, error: "Name missing" });
  });
});
