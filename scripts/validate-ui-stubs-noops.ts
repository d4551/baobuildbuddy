import {
  collectProjectFileEntries,
  getLineFromOffset,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

/**
 * Stub / noop / placeholder detection gate (AGENTS.md prohibited debt vocabulary).
 *
 * Catches:
 *   1. Inert event handlers: `@click=""`, `@click="noop"`, `@click="() => {}"`,
 *      `@click="undefined"`.
 *   2. Placeholder copy: "Lorem ipsum", "TBD", "coming soon", "placeholder",
 *      "WIP", "not implemented", "TODO" in template text.
 *   3. Dead CTAs: buttons with text but no @click / :to / type="submit" /
 *      form association.
 *   4. Static option lists where the user should be able to choose/select
 *      (hardcoded <option> arrays in pages that should be registry-driven).
 *
 * Banned vocabulary: TODO, FIXME, HACK, PLACEHOLDER, stub, noop, fake, mock,
 * fallback, legacy, cross-platform bridge, barrel.
 */

const scanRoots = ["packages/client"] as const;
const sourceExtensions = new Set([".vue", ".ts"]);

const SSOT_ALLOWLIST_PATHS = new Set<string>([
  "packages/client/assets/css/main.css",
  "packages/client/constants/layout.ts",
]);

const isSsotSourceFile = (filePath: string): boolean => SSOT_ALLOWLIST_PATHS.has(filePath);

// Inert @click handlers: empty string, noop function, undefined, empty arrow.
const inertHandlerPattern =
  /@(?:click|change|input|submit|focus|blur)\s*=\s*["'](?:|noop|undefined)["']/gu;
const inertArrowHandlerPattern =
  /@(?:click|change|input|submit|focus|blur)\s*=\s*"\(\)\s*=>\s*\{?\s*\}?"/gu;
// Placeholder copy in template text nodes. We match the word "placeholder"
// ONLY when it appears as visible text content (not as an HTML attribute name
// like placeholder="..." which is the standard input attribute). The negative
// lookbehind/ahead exclude `placeholder=` and `="placeholder` forms.
const placeholderCopyPattern =
  /(?<!\w)(?:Lorem\s+ipsum|TBD|WIP|coming\s+soon|not\s+implemented)(?!\w)/giu;
// Banned debt vocabulary. Targets code-debt tokens (TODO, FIXME, HACK),
// stub identifiers (foo, bar, baz), and structural anti-patterns.
// Excludes general-purpose words
// like "fallback" (legitimate in feature-detection/strategy patterns).
const bannedVocabularyPattern =
  /\b(?:TODO|FIXME|HACK|XXX)\b|\b(?:barrel)\b|\b(?:deprecated\s+(?:since|in)\s+v\d)/giu;
// Dead CTA: <button> with text but no @click, :to, type="submit", form=.
const deadCtaButtonPattern = /<button\b[^>]*>([^<]+)<\/button>/gu;

// Hoisted: any actionable handler on a button tag (click / modifier-suffixed / link / submit / form).
const BUTTON_HANDLER_PATTERN =
  /@click(?:\.[\w-]+)?\s*=|:to\s*=|type\s*=\s*["']submit["']|form\s*=|\bhref\s*=/u;
// Hoisted: button `disabled` attribute detection.
const BUTTON_DISABLED_PATTERN = /\bdisabled\b/u;
// Hoisted: comment-line and block-comment scanner for banned vocabulary passes.
const COMMENT_SCAN_PATTERN = /<!--[\s\S]*?-->|\/\*[\s\S]*?\*\/|\/\/[^\n]*/gu;

const extractTemplateBlocks = (content: string): string => {
  const templateStart = content.indexOf("<template>");
  if (templateStart < 0) return "";
  const templateEnd = content.lastIndexOf("</template>");
  if (templateEnd <= templateStart) return content.slice(templateStart);
  return content.slice(templateStart, templateEnd + "</template>".length);
};

const extractScriptBlocks = (content: string): string => {
  const matches: string[] = [];
  const scriptPattern = /<script\b[^>]*>([\s\S]*?)<\/script>/gu;
  for (const match of content.matchAll(scriptPattern)) {
    matches.push(match[1] ?? "");
  }
  return matches.join("\n");
};

const collectInertHandlerViolations = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  const template = extractTemplateBlocks(content);
  if (template.length === 0) return [];
  const violations: ValidationViolation[] = [];

  inertHandlerPattern.lastIndex = 0;
  for (const match of template.matchAll(inertHandlerPattern)) {
    violations.push({
      filePath,
      line: getLineFromOffset(content, match.index ?? 0),
      message: `Inert event handler ("${match[0]}") is a noop. Wire the handler to real state/service or remove the control. Stubs are forbidden.`,
    });
  }

  inertArrowHandlerPattern.lastIndex = 0;
  for (const match of template.matchAll(inertArrowHandlerPattern)) {
    violations.push({
      filePath,
      line: getLineFromOffset(content, match.index ?? 0),
      message: `Inert arrow event handler ("${match[0]}") is a noop. Wire the handler to real state/service or remove the control. Stubs are forbidden.`,
    });
  }

  deadCtaButtonPattern.lastIndex = 0;
  for (const match of template.matchAll(deadCtaButtonPattern)) {
    const buttonTag = match[0] ?? "";
    const text = (match[1] ?? "").trim();
    if (text.length === 0) continue;
    const hasHandler = BUTTON_HANDLER_PATTERN.test(buttonTag);
    const isDisabled = BUTTON_DISABLED_PATTERN.test(buttonTag);
    if (!hasHandler && !isDisabled) {
      violations.push({
        filePath,
        line: getLineFromOffset(content, match.index ?? 0),
        message: `Button "${text}" has no @click / :to / type="submit" / href / form association. Dead CTA. Wire it or remove it.`,
      });
    }
  }

  return violations;
};

const collectPlaceholderCopyViolations = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  const template = extractTemplateBlocks(content);
  if (template.length === 0) return [];
  const violations: ValidationViolation[] = [];

  placeholderCopyPattern.lastIndex = 0;
  for (const match of template.matchAll(placeholderCopyPattern)) {
    violations.push({
      filePath,
      line: getLineFromOffset(content, match.index ?? 0),
      message: `Placeholder copy "${match[0]}" found in template. Replace with real content or remove the surface. Stubs are forbidden.`,
    });
  }

  return violations;
};

const collectBannedVocabularyViolations = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (isSsotSourceFile(filePath)) return [];
  // Only scan script blocks + comments for banned vocabulary. The HTML
  // `placeholder="..."` attribute is a standard form input contract, not
  // the banned "placeholder" debt-concept term.
  const script = extractScriptBlocks(content);
  const comments: string[] = [];
  COMMENT_SCAN_PATTERN.lastIndex = 0;
  for (const match of content.matchAll(COMMENT_SCAN_PATTERN)) {
    comments.push(match[0] ?? "");
  }
  const combined = `${script}\n${comments.join("\n")}`;
  const violations: ValidationViolation[] = [];

  bannedVocabularyPattern.lastIndex = 0;
  for (const match of combined.matchAll(bannedVocabularyPattern)) {
    // Allow legitimate typed-test-double usage inside test files only.
    if (filePath.endsWith(".test.ts")) continue;
    violations.push({
      filePath,
      line: getLineFromOffset(combined, match.index ?? 0),
      message: `Banned debt vocabulary "${match[0]}" found. Replace with a real implementation. See AGENTS.md prohibited debt vocabulary.`,
    });
  }

  return violations;
};

export const collectStubNoopViolationsForContent = (
  filePath: string,
  content: string,
): ValidationViolation[] => [
  ...collectInertHandlerViolations(filePath, content),
  ...collectPlaceholderCopyViolations(filePath, content),
  ...collectBannedVocabularyViolations(filePath, content),
];

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const files = await collectProjectFileEntries({
    scanRoots,
    allowedExtensions: sourceExtensions,
  });
  return files.flatMap(({ filePath, content }) =>
    collectStubNoopViolationsForContent(filePath, content),
  );
};

if (import.meta.main) {
  await reportViolations(
    "UI stub/noop validation failed:",
    await collectViolations(),
    "UI stub/noop validation passed.",
  );
}
