const NUM_180 = 180;
const NUM_200 = 200;
const NUM_600 = 600;
const NUM_8 = 8;
const NUM_80 = 80;

/**
 * Interaction actions for browser-interaction-burndown (complexity + size split).
 */
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { Page } from "playwright";
import { settle } from "../packages/shared/src/utils/promise";
import { type ChromeSignals, collectChromeSignals } from "./browser-interaction-burndown-chrome";

export type Finding = {
  readonly viewport: string;
  readonly route: string;
  readonly action: string;
  readonly severity: "error" | "warn";
  readonly detail: string;
  readonly screenshot: string | null;
};

const NON_SLUG_RE = /[^\w-]+/gu;
export const slugify = (value: string): string => value.replace(NON_SLUG_RE, "_").slice(0, NUM_80);

export const mapSequential = async <TItem, TResult>(
  items: readonly TItem[],
  mapper: (item: TItem) => Promise<TResult>,
  index = 0,
): Promise<TResult[]> => {
  const item = items[index];
  if (item === undefined) return [];
  const head = await mapper(item);
  return [head, ...(await mapSequential(items, mapper, index + 1))];
};

export const waitForPageReady = async (page: Page, timeout: number): Promise<void> => {
  await page
    .locator("body")
    .waitFor({ state: "visible", timeout })
    .then(
      () => undefined,
      () => undefined,
    );
  await page.waitForLoadState("domcontentloaded", { timeout }).then(
    () => undefined,
    () => undefined,
  );
};

export const captureFinding = async (
  page: Page,
  findings: Finding[],
  outDir: string,
  viewport: string,
  route: string,
  action: string,
  detail: string,
  severity: "error" | "warn" = "error",
): Promise<void> => {
  let screenshot: string | null = null;
  if (severity === "error") {
    screenshot = join(outDir, viewport, `${slugify(route)}__${slugify(action)}.png`);
    await mkdir(join(outDir, viewport), { recursive: true });
    await page.screenshot({ path: screenshot, fullPage: false });
  }
  findings.push({ viewport, route, action, severity, detail, screenshot });
};

export const openRoute = async (
  page: Page,
  clientBase: string,
  route: string,
  consoleBucket: string[],
  pageErrorBucket: string[],
): Promise<void> => {
  consoleBucket.length = 0;
  pageErrorBucket.length = 0;
  await page.goto(`${clientBase}${route}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await waitForPageReady(page, NUM_600);
};

const pushShellFinding = async (
  page: Page,
  findings: Finding[],
  outDir: string,
  viewport: string,
  route: string,
  action: string,
  detail: string,
  condition: boolean,
): Promise<void> => {
  if (!condition) return;
  await captureFinding(page, findings, outDir, viewport, route, action, detail);
};

const shellFindingSpecs = (
  shell: ChromeSignals,
): readonly { action: string; detail: string; condition: boolean }[] => [
  {
    action: "shell-main",
    detail: `expected 1 main, got ${String(shell.mains)}`,
    condition: shell.mains !== 1,
  },
  { action: "shell-h1", detail: "missing h1", condition: shell.h1.length === 0 },
  { action: "shell-title", detail: "empty document title", condition: shell.title.length === 0 },
  {
    action: "overflow-x",
    detail: `document overflowX=${String(shell.overflowX)}`,
    condition: shell.overflowX > NUM_8,
  },
  { action: "truncated-chrome", detail: "navbar ellipsis gut", condition: shell.truncatedChrome },
  {
    action: "clipped-section-tabs",
    detail: "section tab label scrollWidth>clientWidth",
    condition: shell.clippedSectionTabs,
  },
  {
    action: "duplicate-chrome-copy",
    detail: shell.duplicateChromeCopy[0] ?? "dup",
    condition: shell.duplicateChromeCopy.length > 0,
  },
  { action: "raw-glass", detail: "backdrop outside glass-*", condition: shell.rawGlass },
];

export const probeRouteShell = async (
  page: Page,
  findings: Finding[],
  outDir: string,
  viewport: string,
  route: string,
): Promise<ChromeSignals> => {
  const shell = await collectChromeSignals(page);
  await mapSequential(shellFindingSpecs(shell), async (spec) => {
    await pushShellFinding(
      page,
      findings,
      outDir,
      viewport,
      route,
      spec.action,
      spec.detail,
      spec.condition,
    );
  });
  return shell;
};

const listClickableControlLabels = async (
  page: Page,
  maxClicks: number,
): Promise<readonly string[]> => {
  const evaluated = await settle(
    page.evaluate((limit: number) => {
      const main = document.querySelector("main");
      if (!main) return [];
      return [
        ...new Set(
          Array.from(main.querySelectorAll("button, a.btn, a[href]"))
            .filter((control): control is HTMLElement => control instanceof HTMLElement)
            .filter(
              (control) =>
                !control.hasAttribute("disabled") &&
                control.getAttribute("aria-disabled") !== "true",
            )
            .filter((control) => {
              const style = window.getComputedStyle(control);
              return style.visibility !== "hidden" && style.display !== "none";
            })
            .map((control) => {
              const aria = control.getAttribute("aria-label")?.replace(/\s+/gu, " ").trim() ?? "";
              const text = control.textContent?.replace(/\s+/gu, " ").trim() ?? "";
              return aria.length > 0 ? aria : text;
            })
            .filter((label) => label.length > 0 && label.length < NUM_80),
        ),
      ].slice(0, limit);
    }, maxClicks),
  );
  return evaluated.status === "fulfilled" ? evaluated.value : [];
};

const tryClickLabelInPage = async (page: Page, label: string): Promise<boolean> => {
  const clickResult = await settle(
    page.evaluate((targetLabel) => {
      const normalize = (value: string): string => value.replace(/\s+/gu, " ").trim();
      const match = Array.from(
        document.querySelectorAll("main button, main a.btn, main a[href]"),
      ).find((control) => {
        if (!(control instanceof HTMLElement)) return false;
        if (control.hasAttribute("disabled") || control.getAttribute("aria-disabled") === "true") {
          return false;
        }
        const aria = normalize(control.getAttribute("aria-label") ?? "");
        const text = normalize(control.textContent ?? "");
        return (aria.length > 0 ? aria : text) === targetLabel;
      });
      if (!(match instanceof HTMLElement)) return false;
      match.click();
      return true;
    }, label),
  );
  return clickResult.status === "fulfilled" && clickResult.value;
};

const clickOneLabel = async (
  page: Page,
  clientBase: string,
  outDir: string,
  viewport: string,
  route: string,
  label: string,
  findings: Finding[],
  consoleBucket: string[],
  pageErrorBucket: string[],
  maxClicks: number,
): Promise<void> => {
  consoleBucket.length = 0;
  pageErrorBucket.length = 0;
  const clicked = await tryClickLabelInPage(page, label);
  if (!clicked) {
    const stillListedResult = await settle(listClickableControlLabels(page, maxClicks));
    const stillListed =
      stillListedResult.status === "fulfilled" && stillListedResult.value.includes(label);
    if (stillListed) {
      await captureFinding(
        page,
        findings,
        outDir,
        viewport,
        route,
        `click-${slugify(label)}`,
        "control not found",
        "warn",
      );
    }
  }
  await waitForPageReady(page, NUM_180);
  const origin = `${clientBase}${route}`;
  if (!page.url().startsWith(origin)) {
    await openRoute(page, clientBase, route, consoleBucket, pageErrorBucket);
  }
  if (pageErrorBucket.length > 0) {
    await captureFinding(
      page,
      findings,
      outDir,
      viewport,
      route,
      `after-click-${slugify(label)}`,
      pageErrorBucket[0] ?? "",
    );
  }
};

export const clickVisibleControls = async (
  page: Page,
  clientBase: string,
  outDir: string,
  viewport: string,
  route: string,
  findings: Finding[],
  consoleBucket: string[],
  pageErrorBucket: string[],
  maxClicks: number,
): Promise<number> => {
  const labels = await listClickableControlLabels(page, maxClicks);
  await mapSequential(labels, async (label) => {
    await clickOneLabel(
      page,
      clientBase,
      outDir,
      viewport,
      route,
      label,
      findings,
      consoleBucket,
      pageErrorBucket,
      maxClicks,
    );
    const origin = `${clientBase}${route}`;
    if (page.url() !== origin) {
      await openRoute(page, clientBase, route, consoleBucket, pageErrorBucket);
    }
  });
  return labels.length;
};

export const probeFirstTextInput = async (
  page: Page,
  outDir: string,
  viewport: string,
  route: string,
  findings: Finding[],
  consoleBucket: string[],
  pageErrorBucket: string[],
): Promise<void> => {
  const input = page.getByRole("textbox").first();
  if ((await input.count()) === 0) return;
  consoleBucket.length = 0;
  pageErrorBucket.length = 0;
  await input.fill("burndown-probe");
  await waitForPageReady(page, NUM_200);
  if (pageErrorBucket.length > 0) {
    await captureFinding(
      page,
      findings,
      outDir,
      viewport,
      route,
      "textbox-probe",
      pageErrorBucket[0] ?? "",
    );
  }
};
