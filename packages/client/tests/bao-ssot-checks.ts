/**
 * Individual .bao SSOT violation checks.
 *
 * Each check is a pure function: (line: string, rel: string, lineNum: number, content: string) => SSOTViolation | null
 */

import type { SSOTViolation } from "./bao-ssot-helpers";

export type ViolationCheck = (
  line: string,
  rel: string,
  lineNum: number,
  fullContent: string,
) => SSOTViolation | null;

/** Check: bg-base-100 on cards must use glass system */
export const checkBgBase100: ViolationCheck = (line, rel, lineNum) => {
  if (!/\bbg-base-100\b/.test(line) || !/\bcard\b/.test(line)) return null;
  if (
    /\bdrawer\b/.test(line) ||
    line.includes("SURFACE_GLASS") ||
    line.includes("glass") ||
    line.includes("// allow")
  )
    return null;
  return {
    category: "glass-surface",
    rule: "Card elements must use SURFACE_GLASS_CARD_CLASS, not raw bg-base-100",
    evidence: `${rel}:${lineNum} → ${line.trim()}`,
    fix: "Replace with SURFACE_GLASS_CARD_CLASS (import from ~/constants/layout)",
  };
};

/** Check: bg-base-200 on content cards must use glass */
export const checkBgBase200: ViolationCheck = (line, rel, lineNum) => {
  if (!/\bbg-base-200\b/.test(line) || !/\bcard\b/.test(line)) return null;
  if (
    line.includes("auth-shell") ||
    line.includes("hero") ||
    line.includes("PAGE_HERO") ||
    line.includes("AUTH")
  )
    return null;
  return {
    category: "glass-surface",
    rule: "Content cards must use glass system, not bg-base-200",
    evidence: `${rel}:${lineNum} → ${line.trim()}`,
    fix: "Replace with SURFACE_GLASS_CARD_CLASS (import from ~/constants/layout)",
  };
};

/** Check: SHADOW_TOKEN_CLASS on cards — glass handles shadows */
export const checkShadowToken: ViolationCheck = (line, rel, lineNum) => {
  if (!/SHADOW_TOKEN_CLASS\.\w+/.test(line) || !/\bcard\b/.test(line)) return null;
  if (line.includes("// allow")) return null;
  return {
    category: "glass-shadow",
    rule: "Cards should use glass surface system, not SHADOW_TOKEN_CLASS",
    evidence: `${rel}:${lineNum} → ${line.trim()}`,
    fix: "Replace card with SURFACE_GLASS_CARD_CLASS (glass handles shadows)",
  };
};

/** Check: raw hex colors in class bindings */
export const checkRawColor: ViolationCheck = (line, rel, lineNum) => {
  if (
    !/#[0-9a-fA-F]{3,8}\b/.test(line) ||
    line.includes("main.css") ||
    line.includes("// hex test value")
  )
    return null;
  if (!line.includes("class")) return null;
  return {
    category: "raw-color",
    rule: "Raw hex color values in class bindings violate token system",
    evidence: `${rel}:${lineNum} → ${line.trim()}`,
    fix: "Use design tokens (--color-*, text-primary/secondary/muted) instead of raw hex",
  };
};

/** Check: fixed pixel dimensions in inline styles */
export const checkFixedPixel: ViolationCheck = (line, rel, lineNum) => {
  if (!/\bstyle=["'][^"']*:\s*\d+px/.test(line)) return null;
  return {
    category: "fixed-pixel",
    rule: "Fixed pixel dimensions in inline styles violate responsive design",
    evidence: `${rel}:${lineNum} → ${line.trim()}`,
    fix: "Use Tailwind token scale (w-*, h-*) or design token consts",
  };
};

/** Check: off-token spacing values */
export const checkOffTokenSpacing: ViolationCheck = (line, rel, lineNum) => {
  const m = line.match(
    /\b(m[tblrxy]?|p[tblrxy]?|gap|space-[xy])-(7|9|11|13|14|15|17|18|19|21|22|23|25|26|27|28|29|30|31|33|34|35|36|37|38|39)\b/,
  );
  if (!m) return null;
  return {
    category: "off-token-spacing",
    rule: `Off-token spacing value "${m[0]}" not in canonical scale`,
    evidence: `${rel}:${lineNum} → ${line.trim()}`,
    fix: "Use token scale: 0,0.5,1,2,3,4,5,6,8,10,12,16,20,24,32,40,48,56,64",
  };
};

/** Check: raw grid/grid-cols in page files */
export const checkRawGrid: ViolationCheck = (line, rel, lineNum) => {
  if (!rel.startsWith("pages/") || rel.includes("layouts/")) return null;
  if (!/\bclass=["'][^"']*\bgrid\s+grid-cols/.test(line)) return null;
  if (line.includes("SectionGrid") || line.includes("UI_GRID")) return null;
  return {
    category: "raw-grid",
    rule: "Page files should use SectionGrid with grid-token, not raw grid-cols classes",
    evidence: `${rel}:${lineNum} → ${line.trim()}`,
    fix: 'Use <SectionGrid grid-token="..."> instead of raw grid classes',
  };
};

/** Check: inline SVGs in page files without icon-registry import */
export const checkInlineSvg: ViolationCheck = (line, rel, lineNum, fullContent) => {
  if (!/\bviewBox=["']0\s+0\s+24\s+24["']/.test(line) || !rel.startsWith("pages/")) return null;
  if (
    fullContent.includes("icon-registry") ||
    fullContent.includes("IconCheckCircle") ||
    fullContent.includes("IconSearch")
  )
    return null;
  return {
    category: "inline-svg",
    rule: "Pages should use icon-registry components, not inline SVG markup",
    evidence: `${rel}:${lineNum} → ${line.trim()}`,
    fix: "Import from ~/components/icons/icon-registry.ts and use <IconName />",
  };
};

/** Check: hover:bg-base-200 on non-glass elements */
export const checkHoverBgBase200: ViolationCheck = (line, rel, lineNum) => {
  if (!/\bhover:bg-base-200\b/.test(line) || line.includes("glass")) return null;
  return {
    category: "glass-hover",
    rule: "Hover transitions should use glass-interactive, not raw bg-base-200 hover",
    evidence: `${rel}:${lineNum} → ${line.trim()}`,
    fix: "Add glass-interactive class + SURFACE_GLASS_CARD_CLASS for fluid hover",
  };
};

/** Check: raw font-family declarations */
export const checkRawFont: ViolationCheck = (line, rel, lineNum) => {
  if (
    !/\bfont-family\s*:/.test(line) ||
    line.includes("main.css") ||
    line.includes("var(--brand-font")
  )
    return null;
  return {
    category: "raw-font",
    rule: "Font-family must use CSS variable tokens (--brand-font-*), not raw declarations",
    evidence: `${rel}:${lineNum} → ${line.trim()}`,
    fix: "Use font-family: var(--brand-font-body) or var(--brand-font-display)",
  };
};

/** Check: arbitrary Tailwind values that should use tokens */
export const checkArbitraryValue: ViolationCheck = (line, rel, lineNum) => {
  const m = line.match(/\[[^\]]*\d+[^\]]*\]/);
  if (!m) return null;
  if (line.includes("ui-layout.ts") || line.includes("// documented")) return null;
  if (
    line.includes("grid-cols-[") ||
    line.includes("duration-[") ||
    line.includes("ease-[") ||
    line.includes("content-[")
  )
    return null;
  return {
    category: "arbitrary-value",
    rule: "Arbitrary Tailwind value should use token scale or documented SSOT",
    evidence: `${rel}:${lineNum} → ${line.trim()}`,
    fix: "Use a token constant from ui-layout.ts or document the arbitrary value rationale",
  };
};
