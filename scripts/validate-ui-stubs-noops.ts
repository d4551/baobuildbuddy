import { isUiSsotAuthority } from "./ui-ssot-authority";
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
 *   2. Placeholder copy: "Lorem ipsum", "TBD", "coming soon", "not implemented".
 *   3. Dead CTAs: actionable controls (`<button`, `.btn`, `role="button"`) with
 *      no wiring — including icon-only / nested-content controls.
 *   4. Banned debt vocabulary in script/comments (authority paths exempt).
 */

const scanRoots = ["packages/client"] as const;
const sourceExtensions = new Set([".vue", ".ts"]);

const inertHandlerPattern =
  /@(?:click|change|input|submit|focus|blur)(?:\.[\w-]+)*\s*=\s*["'](?:|noop|undefined)["']/gu;
const inertArrowHandlerPattern =
  /@(?:click|change|input|submit|focus|blur)(?:\.[\w-]+)*\s*=\s*"\(\)\s*=>\s*\{?\s*\}?"/gu;
const placeholderCopyPattern =
  /(?<!\w)(?:Lorem\s+ipsum|TBD|WIP|coming\s+soon|not\s+implemented)(?!\w)/giu;
const bannedVocabularyPattern =
  /\b(?:TODO|FIXME|HACK|XXX)\b|\b(?:barrel)\b|\b(?:deprecated\s+(?:since|in)\s+v\d)/giu;

/** Opening tag matcher — attributes may span lines; stops at unquoted `>`. */
const OPENING_TAG_PATTERN = /<([A-Za-z][\w-]*)\b((?:[^>"']|"[^"]*"|'[^']*')*)>/gu;

const CONTROL_HANDLER_PATTERN =
  /@click(?:\.[\w-]+)*\s*=|:(?:to|href)\s*=|\bto\s*=\s*["']|\bhref\s*=\s*["']|type\s*=\s*["']submit["']|\bform\s*=|\bfor\s*=/u;
const CONTROL_DISABLED_PATTERN = /\bdisabled\b|:disabled\s*=/u;
const BTN_CLASS_PATTERN = /\bbtn\b/u;
const ROLE_BUTTON_PATTERN = /\brole\s*=\s*["']button["']/u;
const COMMENT_SCAN_PATTERN = /<!--[\s\S]*?-->|\/\*[\s\S]*?\*\/|\/\/[^\n]*/gu;
const NESTED_TAG_STRIP_PATTERN = /<[^>]+>/gu;
const I18N_BINDING_STRIP_PATTERN = /\{\{[\s\S]*?\}\}/gu;
const WHITESPACE_COLLAPSE_PATTERN = /\s+/gu;
const VUE_COMPONENT_TAG_PATTERN = /^[A-Z]/u;
const NATIVE_CONTROL_INNER_PATTERN = /<(?:input|select|textarea)\b/iu;
const LINK_TO_ATTR_PATTERN = /(?:^|\s)(?:to|:to)\s*=/u;
const CLOSE_TAG_START_PATTERN = /<\//u;
const ARIA_HIDDEN_TRUE_PATTERN = /\baria-hidden\s*=\s*["']true["']/u;
const SWAP_CLASS_PATTERN = /\bswap\b/u;
const SCRIPT_BLOCK_PATTERN = /<script\b[^>]*>([\s\S]*?)<\/script>/gu;

const extractTemplateBlocks = (content: string): string => {
  const templateStart = content.indexOf("<template>");
  if (templateStart < 0) return "";
  const templateEnd = content.lastIndexOf("</template>");
  if (templateEnd <= templateStart) return content.slice(templateStart);
  return content.slice(templateStart, templateEnd + "</template>".length);
};

const extractScriptBlocks = (content: string): string => {
  const matches: string[] = [];
  SCRIPT_BLOCK_PATTERN.lastIndex = 0;
  for (const match of content.matchAll(SCRIPT_BLOCK_PATTERN)) {
    matches.push(match[1] ?? "");
  }
  return matches.join("\n");
};

const isVueComponentTag = (tagName: string): boolean => VUE_COMPONENT_TAG_PATTERN.test(tagName);

const isActionableControlTag = (tagName: string, attrs: string): boolean => {
  // PascalCase Vue SFCs encapsulate their own wiring (e.g. AppExportMenu).
  if (isVueComponentTag(tagName)) return false;
  const normalized = tagName.toLowerCase();
  if (normalized === "button") return true;
  if (ROLE_BUTTON_PATTERN.test(attrs)) return true;
  if (BTN_CLASS_PATTERN.test(attrs)) return true;
  return false;
};

const hasNestedNativeControl = (template: string, openTagEnd: number, tagName: string): boolean => {
  const closeNeedle = `</${tagName}>`;
  const after = template.slice(openTagEnd);
  const closeIdx = after.toLowerCase().indexOf(closeNeedle.toLowerCase());
  if (closeIdx < 0) return false;
  const inner = after.slice(0, closeIdx);
  return NATIVE_CONTROL_INNER_PATTERN.test(inner);
};

const isLinkComponent = (tagName: string): boolean => {
  const normalized = tagName.toLowerCase();
  return normalized === "nuxtlink" || normalized === "nuxt-link" || normalized === "router-link";
};

const hasControlWiring = (tagName: string, attrs: string): boolean => {
  if (CONTROL_HANDLER_PATTERN.test(attrs)) return true;
  // NuxtLink / RouterLink without explicit attrs still needs :to — do not auto-pass.
  if (isLinkComponent(tagName) && LINK_TO_ATTR_PATTERN.test(attrs)) return true;
  return false;
};

const extractControlInnerPreview = (template: string, openTagEnd: number): string => {
  const after = template.slice(openTagEnd);
  const closeIdx = after.search(CLOSE_TAG_START_PATTERN);
  const inner = closeIdx >= 0 ? after.slice(0, closeIdx) : after.slice(0, 80);
  return inner
    .replace(NESTED_TAG_STRIP_PATTERN, " ")
    .replace(I18N_BINDING_STRIP_PATTERN, " ")
    .replace(WHITESPACE_COLLAPSE_PATTERN, " ")
    .trim()
    .slice(0, 40);
};

const collectInertHandlerViolations = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  const template = extractTemplateBlocks(content);
  if (template.length === 0) return [];
  const violations: ValidationViolation[] = [];
  const templateOffset = content.indexOf("<template>");

  inertHandlerPattern.lastIndex = 0;
  for (const match of template.matchAll(inertHandlerPattern)) {
    violations.push({
      filePath,
      line: getLineFromOffset(content, (match.index ?? 0) + Math.max(0, templateOffset)),
      message: `Inert event handler ("${match[0]}") is a noop. Wire the handler to real state/service or remove the control. Stubs are forbidden.`,
    });
  }

  inertArrowHandlerPattern.lastIndex = 0;
  for (const match of template.matchAll(inertArrowHandlerPattern)) {
    violations.push({
      filePath,
      line: getLineFromOffset(content, (match.index ?? 0) + Math.max(0, templateOffset)),
      message: `Inert arrow event handler ("${match[0]}") is a noop. Wire the handler to real state/service or remove the control. Stubs are forbidden.`,
    });
  }

  return violations;
};

const collectDeadControlViolations = (filePath: string, content: string): ValidationViolation[] => {
  const template = extractTemplateBlocks(content);
  if (template.length === 0) return [];
  const violations: ValidationViolation[] = [];
  const templateOffset = content.indexOf("<template>");

  OPENING_TAG_PATTERN.lastIndex = 0;
  for (const match of template.matchAll(OPENING_TAG_PATTERN)) {
    const tagName = match[1] ?? "";
    const attrs = match[2] ?? "";
    if (!isActionableControlTag(tagName, attrs)) continue;
    if (CONTROL_DISABLED_PATTERN.test(attrs)) continue;
    if (ARIA_HIDDEN_TRUE_PATTERN.test(attrs)) continue;
    if (hasControlWiring(tagName, attrs)) continue;

    const normalized = tagName.toLowerCase();
    const openTagEnd = (match.index ?? 0) + match[0].length;
    // Native disclosure / labelled control chrome (daisyUI swap, details).
    if (normalized === "summary") continue;
    if (
      normalized === "label" &&
      (SWAP_CLASS_PATTERN.test(attrs) || hasNestedNativeControl(template, openTagEnd, tagName))
    ) {
      continue;
    }

    const preview = extractControlInnerPreview(template, openTagEnd);
    const label = preview.length > 0 ? preview : `(icon-only ${tagName})`;
    violations.push({
      filePath,
      line: getLineFromOffset(content, (match.index ?? 0) + Math.max(0, templateOffset)),
      message: `Dead CTA control "${label}" (<${tagName}> / .btn / role=button) has no @click / :to / to / type="submit" / href / for / form association. Wire it or remove it.`,
    });
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
  const templateOffset = content.indexOf("<template>");

  placeholderCopyPattern.lastIndex = 0;
  for (const match of template.matchAll(placeholderCopyPattern)) {
    violations.push({
      filePath,
      line: getLineFromOffset(content, (match.index ?? 0) + Math.max(0, templateOffset)),
      message: `Placeholder copy "${match[0]}" found in template. Replace with real content or remove the surface. Stubs are forbidden.`,
    });
  }

  return violations;
};

const collectBannedVocabularyViolations = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (isUiSsotAuthority(filePath)) return [];
  if (filePath.endsWith(".test.ts") || filePath.endsWith(".spec.ts")) return [];
  // Locale catalogs carry natural-language copy (e.g. Spanish "todo" = "all").
  if (filePath.includes("/locales/")) return [];

  const script = extractScriptBlocks(content);
  const comments: string[] = [];
  COMMENT_SCAN_PATTERN.lastIndex = 0;
  for (const match of content.matchAll(COMMENT_SCAN_PATTERN)) {
    comments.push(match[0] ?? "");
  }
  // Non-Vue TS modules: scan full content as script surface.
  const combined =
    script.length > 0 ? `${script}\n${comments.join("\n")}` : `${content}\n${comments.join("\n")}`;
  const violations: ValidationViolation[] = [];

  bannedVocabularyPattern.lastIndex = 0;
  for (const match of combined.matchAll(bannedVocabularyPattern)) {
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
  ...collectDeadControlViolations(filePath, content),
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
