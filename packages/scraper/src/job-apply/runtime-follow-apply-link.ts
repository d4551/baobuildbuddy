import type { Response as PlaywrightResponse } from "playwright";
import { settle } from "@bao/shared/utils/promise";
import { automationRuntimeConfig } from "../runtime/config";
import { APPLY_LINK_SELECTOR } from "./runtime-locators";

const HOSTED_APPLY_DOMAINS = ["greenhouse.io", "lever.co"] as const;
const HOSTED_APPLY_HREF_MARKERS = ["greenhouse", "lever", "apply"] as const;

export type FollowApplyLinkOutcome =
  | { readonly kind: "already_hosted"; readonly url: string }
  | { readonly kind: "followed"; readonly url: string }
  | { readonly kind: "no_link"; readonly url: string }
  | { readonly kind: "nav_failed"; readonly url: string; readonly href: string };

/** Minimal locator surface used by the apply-link hop. */
export interface ApplyLinkLocatorPort {
  first(): ApplyLinkLocatorPort;
  count(): Promise<number>;
  getAttribute(name: "href"): Promise<string | null>;
}

/** Minimal page surface used by the apply-link hop — Playwright Page satisfies it. */
export interface ApplyLinkPagePort {
  url(): string;
  locator(selector: string): ApplyLinkLocatorPort;
  goto(
    url: string,
    options?: { waitUntil?: string; timeout?: number },
  ): Promise<PlaywrightResponse | null>;
  waitForLoadState(state?: string, options?: { timeout?: number }): Promise<void>;
}

/** Listing→hosted apply hop honesty — exported for unit tests. */
export const detectAndFollowHostedApplyPage = async (
  page: ApplyLinkPagePort,
): Promise<FollowApplyLinkOutcome> => {
  const currentUrl = page.url();
  if (HOSTED_APPLY_DOMAINS.some((domain) => currentUrl.includes(domain))) {
    return { kind: "already_hosted", url: currentUrl };
  }

  const locator = page.locator(APPLY_LINK_SELECTOR).first();
  const countResult = await settle(locator.count());
  if (countResult.status === "rejected" || countResult.value === 0) {
    return { kind: "no_link", url: currentUrl };
  }

  const hrefResult = await settle(locator.getAttribute("href"));
  if (hrefResult.status === "rejected" || !hrefResult.value) {
    return { kind: "no_link", url: currentUrl };
  }

  const href = hrefResult.value;
  const isKnownHostedApplyPage = HOSTED_APPLY_HREF_MARKERS.some((marker) => href.includes(marker));
  if (!isKnownHostedApplyPage) {
    return { kind: "no_link", url: currentUrl };
  }

  const navigateResult = await settle(
    page.goto(href, {
      waitUntil: "domcontentloaded",
      timeout: automationRuntimeConfig.navigationTimeoutMs,
    }),
  );
  if (navigateResult.status === "rejected") {
    return { kind: "nav_failed", url: page.url(), href };
  }
  await settle(
    page.waitForLoadState("domcontentloaded", {
      timeout: automationRuntimeConfig.secondaryNavigationDelayMs,
    }),
  );
  return { kind: "followed", url: page.url() };
};
