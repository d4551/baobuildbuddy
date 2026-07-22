const NUM_122 = 122;
const NUM_4 = 4;
const NUM_40 = 40;
const NUM_65 = 65;
const NUM_90 = 90;
const NUM_97 = 97;
/**
 * Chrome signal collectors for browser-interaction-burndown (complexity split).
 */
import type { Page } from "playwright";

export type ChromeSignals = {
  readonly mains: number;
  readonly h1: string;
  readonly title: string;
  readonly overflowX: number;
  readonly truncatedChrome: boolean;
  readonly clippedSectionTabs: boolean;
  readonly duplicateChromeCopy: readonly string[];
  readonly rawGlass: boolean;
  readonly bodyLen: number;
};

const collectShellLandmarks = async (page: Page) =>
  page.evaluate(() => {
    const collapseWs = (value: string): string => {
      let out = "";
      let prevSpace = false;
      for (const ch of value) {
        const isSpace = ch === " " || ch === "\n" || ch === "\t" || ch === "\r";
        if (isSpace) {
          if (!prevSpace) out += " ";
          prevSpace = true;
          continue;
        }
        out += ch;
        prevSpace = false;
      }
      return out.trim();
    };
    return {
      mains: document.querySelectorAll("main").length,
      h1: collapseWs(document.querySelector("h1")?.textContent ?? ""),
      title: document.title.trim(),
      overflowX:
        Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth ?? 0) -
        window.innerWidth,
      bodyLen: collapseWs(document.body?.innerText ?? "").length,
    };
  });

const collectChromeQuality = async (page: Page) =>
  page.evaluate(() => {
    const isAsciiLetter = (ch: string): boolean => {
      const code = ch.charCodeAt(0);
      return (code >= NUM_65 && code <= NUM_90) || (code >= NUM_97 && code <= NUM_122);
    };
    const isNavbarEllipsisGut = (text: string): boolean => {
      if (text.length === 2) return isAsciiLetter(text[0] ?? "") && text[1] === "…";
      if (text.length === NUM_4) return isAsciiLetter(text[0] ?? "") && text.slice(1) === "...";
      return false;
    };
    const collapseWs = (value: string): string => value.replace(/\s+/gu, " ").trim();
    const clippedSectionTabs = [...document.querySelectorAll(".tabs .tab")].some((el) => {
      const label =
        el.querySelector("span.truncate, span.font-medium, span.whitespace-nowrap") ??
        (el instanceof HTMLElement ? el : null);
      if (!(label instanceof HTMLElement)) return false;
      if (label.scrollWidth <= label.clientWidth + 1) return false;
      const className = label.className?.toString?.() ?? "";
      const style = getComputedStyle(label);
      const intentionalTruncate =
        className.includes("truncate") || style.textOverflow === "ellipsis";
      return !intentionalTruncate;
    });
    const texts = [...document.querySelectorAll("p")]
      .filter((el) => !el.closest(".grid, .stats, [role='log']"))
      .map((el) => collapseWs(el.textContent ?? ""))
      .filter((text) => text.length > NUM_40);
    const counts = new Map<string, number>();
    for (const text of texts) {
      counts.set(text, (counts.get(text) ?? 0) + 1);
    }
    const rawGlass = [...document.querySelectorAll("*")].some((el) => {
      const style = getComputedStyle(el);
      const filter =
        style.getPropertyValue("backdrop-filter") ||
        style.getPropertyValue("-webkit-backdrop-filter") ||
        "";
      if (!filter || filter === "none") return false;
      return !(el.className?.toString?.() ?? "").includes("glass");
    });
    return {
      truncatedChrome: [...document.querySelectorAll(".navbar *")]
        .map((el) => (el.textContent ?? "").trim())
        .some((text) => isNavbarEllipsisGut(text)),
      clippedSectionTabs,
      duplicateChromeCopy: [...counts.entries()]
        .filter(([, count]) => count > 1)
        .map(([text]) => text),
      rawGlass,
    };
  });

export const collectChromeSignals = async (page: Page): Promise<ChromeSignals> => {
  const landmarks = await collectShellLandmarks(page);
  const quality = await collectChromeQuality(page);
  return {
    mains: landmarks.mains,
    h1: landmarks.h1,
    title: landmarks.title,
    overflowX: landmarks.overflowX,
    bodyLen: landmarks.bodyLen,
    truncatedChrome: quality.truncatedChrome,
    clippedSectionTabs: quality.clippedSectionTabs,
    duplicateChromeCopy: quality.duplicateChromeCopy,
    rawGlass: quality.rawGlass,
  };
};
