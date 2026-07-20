/**
 * Ensures workspace section rails use SSOT scroll-snap tokens (not ad-hoc classes).
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { writeError, writeOutput } from "./utils/cli-output";

const ROOT = process.cwd();
const TARGET = join(ROOT, "packages/client/components/ui/WorkspaceSectionNavigator.vue");

const REQUIRED_TOKENS = [
  "SCROLL_SNAP_X_MANDATORY_CLASS",
  "SCROLL_SNAP_ALIGN_START_CLASS",
  "SCROLL_TOUCH_PAN_X_CLASS",
] as const;

const BANNED_INLINE = /\bsnap-x\b|\btouch-pan-x\b/u;
/** overflow-x-clip on the navigator card kills horizontal section-rail scroll @320. */
const BANNED_OVERFLOW_CLIP = /\boverflow-x-clip\b/u;

export const collectSectionRailScrollViolations = (content: string): string[] => {
  const violations: string[] = [];
  for (const token of REQUIRED_TOKENS) {
    if (!content.includes(token)) {
      violations.push(`missing SSOT token import/use: ${token}`);
    }
  }
  // Ban raw snap / overflow-clip utilities in class="..." string literals (token constants OK).
  const classLiterals = content.matchAll(/class="([^"]*)"/gu);
  for (const match of classLiterals) {
    const classValue = match[1] ?? "";
    if (BANNED_INLINE.test(classValue)) {
      violations.push(`raw scroll utility in class literal: ${classValue}`);
    }
    if (BANNED_OVERFLOW_CLIP.test(classValue)) {
      violations.push("overflow-x-clip banned on WorkspaceSectionNavigator (clips section rail)");
    }
  }
  return violations;
};

const main = async (): Promise<void> => {
  const content = await readFile(TARGET, "utf8");
  const violations = collectSectionRailScrollViolations(content);
  if (violations.length > 0) {
    await Promise.all(violations.map((violation) => writeError(`${TARGET}: ${violation}`)));
    process.exitCode = 1;
    return;
  }
  await writeOutput("section-rail scroll SSOT OK");
};

if (import.meta.main) {
  await main();
}
