import { isControlPrimitiveOwner } from "./ui-control-primitive-owners";
import { isUiSsotAuthority } from "./ui-ssot-authority";
import {
  collectProjectFileEntries,
  getLineFromOffset,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

/**
 * Typography SSOT gate (design.md §2.10).
 *
 * Type scale, weight, and leading must come from:
 *   - TYPOGRAPHY_SCALE_CLASS in constants/layout.ts (sm/xs/lg/2xl/3xl)
 *   - Semantic text helpers: text-primary, text-secondary, text-muted,
 *     text-on-glass, text-on-primary (defined in main.css)
 *   - CARD_TITLE_LG_CLASS, BODY_TEXT_SM_CLASS, BODY_TEXT_XS_CLASS, etc.
 *
 * Raw `text-xl`, `font-bold`, `leading-tight` literals drift from the scale.
 * Zero consumer exemptions — authority + ui/icon primitive owners only.
 */

const scanRoots = ["packages/client"] as const;
const sourceExtensions = new Set([".vue", ".ts", ".css"]);

const isSsotSourceFile = (filePath: string): boolean =>
  isUiSsotAuthority(filePath) || isControlPrimitiveOwner(filePath);

// text-base is an allowed semantic helper; text-xl through text-9xl need tokens.
const rawTextScalePattern = /\btext-(?:xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)\b/gu;
// font-bold, font-semibold, font-medium, font-light — raw weight literals.
const rawFontWeightPattern = /\bfont-(?:bold|extrabold|black)\b/gu;
// leading-tight, leading-snug, leading-7 — raw leading literals.
const rawLeadingPattern = /\bleading-(?:tight|snug|normal|relaxed|loose|\d+)\b/gu;
// tracking-tight, tracking-wide — raw tracking literals.
const rawTrackingPattern = /\btracking-(?:tighter|tight|normal|wide|wider|widest)\b/gu;

const extractTemplateBlocks = (content: string): string => {
  const templateStart = content.indexOf("<template>");
  if (templateStart < 0) return "";
  const templateEnd = content.lastIndexOf("</template>");
  if (templateEnd <= templateStart) return content.slice(templateStart);
  return content.slice(templateStart, templateEnd + "</template>".length);
};

const collectTypographyViolations = (filePath: string, content: string): ValidationViolation[] => {
  if (isSsotSourceFile(filePath)) return [];
  const template = extractTemplateBlocks(content);
  if (template.length === 0) return [];
  const violations: ValidationViolation[] = [];

  const classAttrPattern = /\bclass\s*=\s*["']([^"']+)["']/gu;
  const patterns: Array<{ pattern: RegExp; message: (token: string) => string }> = [
    {
      pattern: rawTextScalePattern,
      message: (token) =>
        `Raw type-scale "${token}" bypasses TYPOGRAPHY_SCALE_CLASS. Import the scale token from constants/layout.ts or use a semantic class constant (CARD_TITLE_LG_CLASS, BODY_TEXT_SM_CLASS).`,
    },
    {
      pattern: rawFontWeightPattern,
      message: (token) =>
        `Raw font-weight "${token}" is bespoke. Define a semantic weight in main.css or use a shared layout constant. Type weight must be SSOT.`,
    },
    {
      pattern: rawLeadingPattern,
      message: (token) =>
        `Raw leading "${token}" is bespoke. Glass containers get line-height from main.css; other contexts should use a shared constant, not an inline literal.`,
    },
    {
      pattern: rawTrackingPattern,
      message: (token) =>
        `Raw tracking "${token}" is bespoke. Define letter-spacing in main.css or consume a shared constant.`,
    },
  ];

  classAttrPattern.lastIndex = 0;
  for (const classMatch of template.matchAll(classAttrPattern)) {
    const classValue = classMatch[1] ?? "";
    const baseLine = getLineFromOffset(content, classMatch.index ?? 0);
    for (const { pattern, message } of patterns) {
      pattern.lastIndex = 0;
      for (const tokenMatch of classValue.matchAll(pattern)) {
        violations.push({
          filePath,
          line: baseLine,
          message: message(tokenMatch[0]),
        });
      }
    }
  }

  return violations;
};

export const collectTypographyViolationsForContent = (
  filePath: string,
  content: string,
): ValidationViolation[] => collectTypographyViolations(filePath, content);

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const files = await collectProjectFileEntries({
    scanRoots,
    allowedExtensions: sourceExtensions,
  });
  return files.flatMap(({ filePath, content }) =>
    collectTypographyViolationsForContent(filePath, content),
  );
};

if (import.meta.main) {
  await reportViolations(
    "UI typography validation failed:",
    await collectViolations(),
    "UI typography validation passed.",
  );
}
