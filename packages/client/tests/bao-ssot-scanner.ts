/**
 * .bao SSOT UI/UX Scanner — runs all violation checks against a single file.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { SSOTViolation } from "./bao-ssot-helpers";
import {
  checkArbitraryValue,
  checkBgBase100,
  checkBgBase200,
  checkFixedPixel,
  checkHoverBgBase200,
  checkInlineSvg,
  checkOffTokenSpacing,
  checkRawColor,
  checkRawFont,
  checkRawGrid,
  checkShadowToken,
} from "./bao-ssot-checks";

const ALL_CHECKS = [
  checkBgBase100,
  checkBgBase200,
  checkShadowToken,
  checkRawColor,
  checkFixedPixel,
  checkOffTokenSpacing,
  checkRawGrid,
  checkInlineSvg,
  checkHoverBgBase200,
  checkRawFont,
  checkArbitraryValue,
];

function scanFile(absPath: string): SSOTViolation[] {
  const content = readFileSync(absPath, "utf8");
  const lines = content.split("\n");
  const rel = absPath.replace(join(import.meta.dirname, ".."), "").replace(/^\//, "");

  if (absPath.endsWith("main.css")) return [];
  if (absPath.includes("constants/layout.ts") || absPath.includes("constants/ui-layout.ts"))
    return [];
  if (absPath.includes("components/icons/")) return [];
  if (absPath.includes(".spec.") || absPath.includes(".test.")) return [];

  const violations: SSOTViolation[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    for (const check of ALL_CHECKS) {
      const result = check(line, rel, lineNum, content);
      if (result) violations.push(result);
    }
  }
  return violations;
}

function collectSourceFiles(dir: string, pattern = /\.(vue|ts)$/): string[] {
  const results: string[] = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    /* skip unreadable */ return results;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".nuxt") continue;
    if (entry.isDirectory()) results.push(...collectSourceFiles(full, pattern));
    else if (pattern.test(entry.name)) results.push(full);
  }
  return results;
}
