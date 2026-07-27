/**
 * Browser page-invariant gate.
 *
 * Every defect found during the manual audit — an onboarding layout with no
 * toast host, a card flush against the viewport edge, a page with two `<h1>`
 * elements — was invisible to the static gates because none of them can see a
 * rendered page. `proof:browser-smoke` already drove all routes at three
 * viewports, but it only captured screenshots and console output: nothing was
 * asserted, so nothing could fail.
 *
 * This drives the same routes and asserts hard invariants, so a regression fails
 * a command instead of waiting to be noticed by eye.
 *
 * Touch targets are measured under a real coarse-pointer context (`hasTouch`),
 * so the `@media (pointer: coarse)` floor in `glass.css` is exercised rather
 * than assumed — a desktop-only run reports `pointer: fine` and would silently
 * skip it. Heights use `offsetHeight`, the untransformed layout height, because
 * daisyUI keeps closed modal content in the DOM and scales it while closed.
 */
import { type Browser, chromium, type Page } from "playwright";
import { APP_ROUTES } from "../packages/shared/src/constants/routes";
import { writeError, writeOutput } from "./utils/cli-output";
import { resolveProofClientBase } from "./utils/proof-script-env";

const CLIENT_BASE = resolveProofClientBase("http://127.0.0.1:3001");

/** Minimum touch target under a coarse pointer (WCAG 2.5.5 / Apple HIG). */
const TOUCH_TARGET_MIN_PX = 44;

/** Navigation settle budget per route. */
const NAVIGATION_TIMEOUT_MS = 30_000;

/** Status at or above which a navigation counts as failed. */
const HTTP_ERROR_STATUS_FLOOR = 400;

/** Status used when a navigation produced no response object. */
const NO_RESPONSE_STATUS = 0;

/** Findings reported per kind per page, so one broken page cannot bury the rest. */
const MAX_REPORTED_PER_KIND = 3;

/** Characters retained from an element label in a finding. */
const LABEL_MAX_LENGTH = 40;

/** Characters retained from a console message in a finding. */
const CONSOLE_MESSAGE_MAX_LENGTH = 160;

/** Matches a standalone `card` class token. */
const CARD_TOKEN_SOURCE = "(?:^|\\s)card(?:\\s|$)";

/** Matches utilities that make a `card` style itself instead of using the primitive. */
const SELF_STYLED_SURFACE_SOURCE = "\\b(?:bg-base-\\d+|card-dash)\\b";

/** Controls subject to the touch-target floor. */
const INTERACTIVE_SELECTOR = "main button, main input, main select, main textarea";

/** Viewports the shell must hold up at. */
const VIEWPORTS = [
  { name: "mobile", width: 320, height: 720, hasTouch: true },
  { name: "tablet", width: 768, height: 1024, hasTouch: true },
  { name: "desktop", width: 1440, height: 900, hasTouch: false },
] as const;

const ROUTES = Object.values(APP_ROUTES);

/** One invariant failure on one route/viewport pair. */
type Violation = {
  route: string;
  viewport: string;
  message: string;
};

/** Structural facts that hold at every viewport. */
type StructureFacts = {
  h1Count: number;
  hasMain: boolean;
  hasToastHost: boolean;
  horizontalOverflow: boolean;
  scrollWidth: number;
  innerWidth: number;
  pointerCoarse: boolean;
};

/** A control rendered below the touch-target floor. */
type SmallTarget = { label: string; height: number };

/**
 * Reads structural facts: landmarks, heading count, overflow, pointer kind.
 */
const readStructureFacts = async (page: Page): Promise<StructureFacts> =>
  page.evaluate(() => {
    const doc = document.documentElement;
    return {
      h1Count: document.querySelectorAll("h1").length,
      hasMain: Boolean(document.querySelector("main")),
      hasToastHost: Boolean(document.getElementById("toast-container")),
      horizontalOverflow: doc.scrollWidth > window.innerWidth,
      scrollWidth: doc.scrollWidth,
      innerWidth: window.innerWidth,
      pointerCoarse: window.matchMedia("(pointer: coarse)").matches,
    };
  });

/**
 * Reads hand-composed card surfaces rendered inside `main`.
 *
 * Pattern sources cross the boundary as strings so no regex literal is compiled
 * per call inside the page function.
 */
const readBespokeCards = async (page: Page): Promise<string[]> =>
  page.evaluate(
    (sources: { cardToken: string; selfStyled: string }) => {
      const cardToken = new RegExp(sources.cardToken, "u");
      const selfStyled = new RegExp(sources.selfStyled, "u");
      const found: string[] = [];
      for (const element of document.querySelectorAll("main [class]")) {
        const classList = element.getAttribute("class") ?? "";
        const isBespoke =
          cardToken.test(classList) &&
          selfStyled.test(classList) &&
          !classList.includes("card-glass");
        if (isBespoke) {
          found.push(classList);
        }
      }
      return found;
    },
    { cardToken: CARD_TOKEN_SOURCE, selfStyled: SELF_STYLED_SURFACE_SOURCE },
  );

/**
 * Reads reachable controls below the touch-target floor.
 */
const readSmallTargets = async (page: Page, minTarget: number): Promise<SmallTarget[]> =>
  page.evaluate(
    (options: { minTarget: number; labelMaxLength: number; selector: string }) => {
      const found: { label: string; height: number }[] = [];
      for (const element of document.querySelectorAll(options.selector)) {
        const hidden =
          element.closest("dialog:not([open])") !== null ||
          element.closest("[aria-hidden='true']") !== null;
        const height = !hidden && element instanceof HTMLElement ? element.offsetHeight : 0;
        if (height > 0 && height < options.minTarget) {
          const raw = element.getAttribute("aria-label") ?? element.textContent ?? element.tagName;
          found.push({ label: raw.trim().slice(0, options.labelMaxLength), height });
        }
      }
      return found;
    },
    { minTarget, labelMaxLength: LABEL_MAX_LENGTH, selector: INTERACTIVE_SELECTOR },
  );

/**
 * Turns structural facts into invariant messages.
 */
const assertStructure = (facts: StructureFacts): string[] => {
  const messages: string[] = [];
  if (!facts.hasMain) {
    messages.push("no <main> landmark");
  }
  if (facts.h1Count !== 1) {
    messages.push(`expected exactly one <h1>, found ${String(facts.h1Count)}`);
  }
  if (!facts.hasToastHost) {
    messages.push("no #toast-container — every toast raised on this page would be dropped");
  }
  if (facts.horizontalOverflow) {
    messages.push(
      `horizontal overflow: scrollWidth ${String(facts.scrollWidth)} > viewport ${String(facts.innerWidth)}`,
    );
  }
  return messages;
};

/**
 * Audits one route at one viewport.
 */
const auditRoute = async (
  browser: Browser,
  viewport: (typeof VIEWPORTS)[number],
  route: string,
): Promise<Violation[]> => {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    hasTouch: viewport.hasTouch,
    isMobile: viewport.hasTouch,
  });
  const page = await context.newPage();
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  const response = await page.goto(`${CLIENT_BASE}${route}`, {
    waitUntil: "domcontentloaded",
    timeout: NAVIGATION_TIMEOUT_MS,
  });
  await page.waitForLoadState("load", { timeout: NAVIGATION_TIMEOUT_MS });

  const status = response?.status() ?? NO_RESPONSE_STATUS;
  const facts = await readStructureFacts(page);
  const bespokeCards = await readBespokeCards(page);
  const smallTargets = viewport.hasTouch ? await readSmallTargets(page, TOUCH_TARGET_MIN_PX) : [];
  await context.close();

  const messages: string[] = [
    ...(status >= HTTP_ERROR_STATUS_FLOOR ? [`HTTP ${String(status)}`] : []),
    ...(viewport.hasTouch && !facts.pointerCoarse
      ? ["context did not report a coarse pointer — touch floor was not exercised"]
      : []),
    ...assertStructure(facts),
    ...bespokeCards
      .slice(0, MAX_REPORTED_PER_KIND)
      .map(
        (classList) =>
          `hand-composed card surface rendered ("${classList}") — must go through UiGlassCard`,
      ),
    ...smallTargets
      .slice(0, MAX_REPORTED_PER_KIND)
      .map(
        (target) =>
          `touch target "${target.label}" is ${String(target.height)}px under a coarse pointer (min ${String(TOUCH_TARGET_MIN_PX)}px)`,
      ),
    ...consoleErrors
      .slice(0, MAX_REPORTED_PER_KIND)
      .map((message) => `console error: ${message.slice(0, CONSOLE_MESSAGE_MAX_LENGTH)}`),
  ];

  return messages.map((message) => ({ route, viewport: viewport.name, message }));
};

/**
 * Walks every route at one viewport, sequentially.
 *
 * Recursion rather than a loop: routes share one browser and one dev server, and
 * awaiting inside a loop is banned by the performance lint.
 */
const auditViewport = async (
  browser: Browser,
  viewport: (typeof VIEWPORTS)[number],
  index: number,
  collected: readonly Violation[],
): Promise<Violation[]> => {
  const route = ROUTES[index];
  if (route === undefined) {
    return [...collected];
  }
  const violations = await auditRoute(browser, viewport, route);
  return auditViewport(browser, viewport, index + 1, [...collected, ...violations]);
};

/**
 * Walks every viewport, sequentially.
 */
const auditAllViewports = async (
  browser: Browser,
  index: number,
  collected: readonly Violation[],
): Promise<Violation[]> => {
  const viewport = VIEWPORTS[index];
  if (viewport === undefined) {
    return [...collected];
  }
  const violations = await auditViewport(browser, viewport, 0, []);
  return auditAllViewports(browser, index + 1, [...collected, ...violations]);
};

const browser = await chromium.launch();
const violations = await auditAllViewports(browser, 0, []);
await browser.close();

const checkedCount = ROUTES.length * VIEWPORTS.length;

if (violations.length === 0) {
  await writeOutput(
    `Browser page invariants passed: ${String(checkedCount)} route/viewport pairs (${String(ROUTES.length)} routes x ${String(VIEWPORTS.length)} viewports).`,
  );
} else {
  await writeError("Browser page invariant validation failed:");
  await Promise.all(
    violations.map((violation) =>
      writeError(`- [${violation.viewport}] ${violation.route}: ${violation.message}`),
    ),
  );
  process.exit(1);
}
