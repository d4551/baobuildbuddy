import {
  collectProjectFileEntries,
  getLineFromOffset,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

/**
 * Motion must come from the SSOT token system in main.css:
 *   --motion-fast / --motion-standard / --motion-slow
 *   --ease-response / --ease-enter / --ease-exit
 *
 * Raw Tailwind duration/ease utilities (`duration-200`, `ease-in-out`,
 * `transition-all`) bypass the motion vocabulary, drift from the spec, and
 * create per-component bespoke animation. This gate enforces the SSOT
 * motion tokens outside the SSOT allowlist (design.md §7.2/§7.3).
 *
 * Allowed forms (consume the CSS variable token):
 *   duration-[var(--motion-fast)]
 *   ease-[var(--ease-response)]
 *   transition-[width]
 *   transition-colors
 */

const scanRoots = ["packages/client"] as const;
const sourceExtensions = new Set([".vue", ".ts", ".css"]);

const SSOT_ALLOWLIST_PATHS = new Set<string>([
  "packages/client/assets/css/main.css",
  "packages/client/constants/layout.ts",
  "packages/client/constants/layout-chrome.ts",
]);

const isSsotSourceFile = (filePath: string): boolean => SSOT_ALLOWLIST_PATHS.has(filePath);

// Raw numeric duration utilities: duration-100, duration-200, duration-1000, etc.
const rawDurationPattern = /\bduration-\d+\b/gu;
// Raw easing utilities (not the SSOT CSS variable form).
// `in-out` must come before `in`/`out` to avoid matching `ease-in` from `ease-in-out`.
const rawEasePattern = /\bease-(?:in-out|linear|in|out)\b/gu;
// transition-all / transition opacity/transform/color are too broad — demand
// explicit property transitions to keep will-change and compositing honest.
const overlyBroadTransitionPattern = /\btransition-all\b/gu;
// Tailwind animation utilities (animate-spin, animate-pulse, animate-bounce,
// animate-ping) bake in vendor-defined timing that bypasses --motion-* tokens.
const rawAnimationUtilityPattern = /\banimate-(?:spin|pulse|bounce|ping)\b/gu;

const extractTemplateBlocks = (content: string): string => {
  const templateStart = content.indexOf("<template>");
  if (templateStart < 0) return "";
  const templateEnd = content.lastIndexOf("</template>");
  if (templateEnd <= templateStart) return content.slice(templateStart);
  return content.slice(templateStart, templateEnd + "</template>".length);
};

const extractStyleBlock = (content: string): string => {
  const styleStart = content.indexOf("<style");
  if (styleStart < 0) return "";
  const styleEnd = content.lastIndexOf("</style>");
  if (styleEnd <= styleStart) return content.slice(styleStart);
  return content.slice(styleStart, styleEnd + "</style>".length);
};

const collectMotionTokenViolations = (filePath: string, content: string): ValidationViolation[] => {
  if (isSsotSourceFile(filePath)) return [];

  const scanContent = extractTemplateBlocks(content);
  const styleContent = extractStyleBlock(content);
  const combined = `${scanContent}\n${styleContent}`;
  if (combined.length === 0) return [];

  const violations: ValidationViolation[] = [];
  const patterns: Array<{ pattern: RegExp; message: (token: string) => string }> = [
    {
      pattern: rawDurationPattern,
      message: (token) =>
        `Raw motion duration "${token}" bypasses the --motion-* token system. Use duration-[var(--motion-fast|standard|slow)] from main.css.`,
    },
    {
      pattern: rawEasePattern,
      message: (token) =>
        `Raw easing utility "${token}" bypasses the --ease-* token system. Use ease-[var(--ease-response|enter|exit)] from main.css.`,
    },
    {
      pattern: overlyBroadTransitionPattern,
      message: (token) =>
        `"${token}" transitions every animatable property. Name the specific property (transition-[width], transition-colors, transition-opacity) to keep compositing and will-change honest.`,
    },
    {
      pattern: rawAnimationUtilityPattern,
      message: (token) =>
        `Raw animation utility "${token}" bakes in vendor timing. Define the keyframe + timing in main.css using --motion-* tokens and consume a canonical class.`,
    },
  ];

  for (const { pattern, message } of patterns) {
    pattern.lastIndex = 0;
    for (const match of combined.matchAll(pattern)) {
      violations.push({
        filePath,
        line: getLineFromOffset(content, match.index ?? 0),
        message: message(match[0]),
      });
    }
  }

  return violations;
};

export const collectMotionTokenViolationsForContent = (
  filePath: string,
  content: string,
): ValidationViolation[] => collectMotionTokenViolations(filePath, content);

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const files = await collectProjectFileEntries({
    scanRoots,
    allowedExtensions: sourceExtensions,
  });
  return files.flatMap(({ filePath, content }) =>
    collectMotionTokenViolationsForContent(filePath, content),
  );
};

if (import.meta.main) {
  await reportViolations(
    "UI motion token validation failed:",
    await collectViolations(),
    "UI motion token validation passed.",
  );
}
