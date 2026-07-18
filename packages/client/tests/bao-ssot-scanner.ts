/**
 * .bao SSOT UI/UX Scanner — runs all violation checks against a single file.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join as pathJoin } from "node:path";
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
import { CLIENT_ROOT } from "./bao-ssot-helpers";

import { join } from "node:path";

// Use a fixed path resolution to avoid import.meta.url type issues in test files.
const _CLIENT_ROOT_SOURCE = pathJoin(process.cwd(), "packages/client");

// Violation checks - typed loosely since this is test infrastructure
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
  const content: string = readFileSync(absPath, "utf8");
  const lines: string[] = content.split("\n");
  const rel: string = absPath.replace(_CLIENT_ROOT_SOURCE + "/", "");

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
      const result = (check as any)(line, rel, lineNum, content);
      if (result) violations.push(result as SSOTViolation);
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
