const NUM_240 = 240;
const NUM_360 = 360;
const NUM_40 = 40;
const NUM_44 = 44;
const RATIO_0_5 = 0.5;

/**
 * DOM signal collectors for browser-visual-smoke (line/complexity split).
 */
import type { Page } from "playwright";
import { APP_ROUTES } from "../packages/shared/src/constants/routes";
import { settle } from "../packages/shared/src/utils/promise";

export type PageSignals = {
  readonly h1: string | null;
  readonly mainCount: number;
  readonly bodySnippet: string;
  readonly dockActive: readonly { href: string | null; label: string }[];
  readonly tables: readonly { width: number; visible: boolean }[];
  readonly underTouch: readonly { label: string; h: number; under: boolean }[];
  readonly setupXpConflict: boolean;
  readonly floatingChatVisible: boolean;
  readonly dockHasAiChat: boolean;
};

const collectLandmarkSignals = async (page: Page) =>
  page.evaluate(() => {
    const collapse = (value: string): string => value.replace(/\s+/gu, " ").trim();
    const h1 = document.querySelector("h1");
    return {
      h1: h1?.textContent ? collapse(h1.textContent) : null,
      mainCount: document.querySelectorAll("main").length,
      bodySnippet: collapse(document.body?.innerText ?? "").slice(0, NUM_240),
      dockActive: Array.from(
        document.querySelectorAll('nav.dock a[aria-current="page"], nav.dock a.dock-active'),
      ).map((el) => ({
        href: el.getAttribute("href"),
        label: collapse(el.getAttribute("aria-label") ?? el.textContent ?? ""),
      })),
      tables: Array.from(document.querySelectorAll("table.table")).map((table) => {
        const rect = table.getBoundingClientRect();
        return { width: rect.width, visible: rect.width > 0 && rect.height > 0 };
      }),
    };
  });

const collectTouchSignals = async (page: Page) =>
  page.evaluate(() => {
    const collapse = (value: string): string => value.replace(/\s+/gu, " ").trim();
    const underTouch = Array.from(
      document.querySelectorAll(
        "nav.dock a, .menu a.min-h-11, .menu a.h-11, .menu button.min-h-11",
      ),
    )
      .map((el) => {
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        if (
          rect.width <= 0 ||
          rect.height <= 0 ||
          style.visibility === "hidden" ||
          style.display === "none"
        ) {
          return null;
        }
        const details = el.closest("details");
        if (details && !details.open) return null;
        return {
          label: collapse(el.getAttribute("aria-label") ?? el.textContent ?? "").slice(0, NUM_40),
          h: rect.height,
          under: rect.height + RATIO_0_5 < NUM_44,
        };
      })
      .filter((row): row is { label: string; h: number; under: boolean } => Boolean(row?.under));
    return { underTouch };
  });

const collectChatChromeSignals = async (page: Page) =>
  page.evaluate((aiRoutePrefix: string) => {
    const collapse = (value: string): string => value.replace(/\s+/gu, " ").trim();
    const isLevelLabel = (value: string): boolean => {
      if (!value.startsWith("Level ")) return false;
      const digits = value.slice("Level ".length);
      return digits.length > 0 && [...digits].every((char) => char >= "0" && char <= "9");
    };
    const setupCtaVisible = Array.from(document.querySelectorAll("a.btn, button.btn")).some(
      (el) => {
        const rect = el.getBoundingClientRect();
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          collapse(el.textContent ?? "")
            .toLowerCase()
            .includes("complete setup")
        );
      },
    );
    const levelLabelVisible = Array.from(document.querySelectorAll("p, span, h2, h3, div")).some(
      (el) => {
        if (el.childElementCount > 2) return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && isLevelLabel(collapse(el.textContent ?? ""));
      },
    );
    const floatingChatVisible = [...document.querySelectorAll("button, a")].some((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return false;
      const aria = (el.getAttribute("aria-label") ?? "").toLowerCase();
      return aria.includes("floating chat") || aria.includes("show floating chat");
    });
    const dockHasAiChat = [...document.querySelectorAll("nav.dock a")].some((a) => {
      const href = a.getAttribute("href") ?? "";
      return href === aiRoutePrefix || href.startsWith(`${aiRoutePrefix}/`);
    });
    return {
      setupXpConflict: setupCtaVisible && levelLabelVisible,
      floatingChatVisible,
      dockHasAiChat,
    };
  }, APP_ROUTES.ai);

const collectPageSignalsOnce = async (page: Page): Promise<PageSignals> => {
  const landmarks = await collectLandmarkSignals(page);
  const touch = await collectTouchSignals(page);
  const chat = await collectChatChromeSignals(page);
  return {
    h1: landmarks.h1,
    mainCount: landmarks.mainCount,
    bodySnippet: landmarks.bodySnippet,
    dockActive: landmarks.dockActive,
    tables: landmarks.tables,
    underTouch: touch.underTouch,
    setupXpConflict: chat.setupXpConflict,
    floatingChatVisible: chat.floatingChatVisible,
    dockHasAiChat: chat.dockHasAiChat,
  };
};

export const collectPageSignals = async (page: Page): Promise<PageSignals> => {
  // HMR/soft-nav can destroy evaluate mid-flight — settle + single retry after ready.
  const first = await settle(collectPageSignalsOnce(page));
  if (first.status === "fulfilled") {
    return first.value;
  }
  await settle(page.waitForLoadState("domcontentloaded", { timeout: 15_000 }));
  const second = await settle(collectPageSignalsOnce(page));
  if (second.status === "fulfilled") {
    return second.value;
  }
  throw first.reason instanceof Error
    ? first.reason
    : new Error(String(first.reason ?? "collectPageSignals failed"));
};

export const isMobileAiOrAutomationRoute = (route: string): boolean =>
  route === APP_ROUTES.ai ||
  route.startsWith(`${APP_ROUTES.ai}/`) ||
  route === APP_ROUTES.automation ||
  route.startsWith(`${APP_ROUTES.automation}/`);

const scoreMobileSignals = (route: string, signals: PageSignals): string | null => {
  if (isMobileAiOrAutomationRoute(route) && signals.dockActive.length === 0) {
    return `dock orphan on ${route} — expected aria-current/dock-active`;
  }
  if (
    route === APP_ROUTES.automationRuns &&
    signals.tables.some((table) => table.visible && table.width > NUM_360)
  ) {
    const maxWidth = Math.max(
      0,
      ...signals.tables.filter((table) => table.visible).map((table) => table.width),
    );
    return `automation runs table still wide @320 (max visible ${String(maxWidth)}px)`;
  }
  if (signals.underTouch.length > 0) {
    return `touch target under 44px: ${signals.underTouch[0]?.label ?? "unknown"} (${String(
      signals.underTouch[0]?.h ?? 0,
    )}px)`;
  }
  if (signals.floatingChatVisible && signals.dockHasAiChat) {
    return "dual chat chrome: floating FAB + dock AI Chat below lg";
  }
  return null;
};

export const scoreSmokeRoute = (
  viewportName: string,
  route: string,
  title: string,
  signals: PageSignals,
  pageErrors: readonly string[],
): string | null => {
  if (signals.mainCount !== 1) {
    return `expected 1 main landmark, got ${String(signals.mainCount)}`;
  }
  if (!signals.h1 || signals.h1.length === 0) return "missing h1";
  if (title.trim().length === 0) return "empty title";
  if (pageErrors.length > 0) return `pageerror: ${pageErrors[0] ?? "unknown"}`;
  if (route === APP_ROUTES.dashboard && signals.setupXpConflict) {
    return "dashboard Setup CTA vs Level/XP gamification contradiction";
  }
  if (viewportName === "mobile") {
    return scoreMobileSignals(route, signals);
  }
  return null;
};
