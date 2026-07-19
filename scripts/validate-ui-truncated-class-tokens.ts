import {
  collectProjectFileEntries,
  getLineFromOffset,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

/**
 * Truncated / incomplete Tailwind utility tokens are always defects.
 * No path allowlists — authority files with truncated tokens also fail.
 *
 * Static `class="…"` values are scanned directly. Bound `:class="…"` values
 * are scanned only via nested string literals so Vue object-syntax keys
 * (`{ 'btn-primary': on }`) are not mistaken for truncated utilities.
 */

const scanRoots = ["packages/client"] as const;
const sourceExtensions = new Set([".vue"]);

/** Match `:class` / `v-bind:class` before bare `class` so bindings are not misread as static. */
const CLASS_ATTRIBUTE_PATTERN = /(?:^|[\s"'`])((?:v-bind:)?:?class)\s*=\s*(["'])([\s\S]*?)\2/gu;
const NESTED_STRING_LITERAL_PATTERN = /(["'`])([^"'`]*?)\1/gu;
const WHITESPACE_PATTERN = /\s+/u;

/**
 * Truncated utilities:
 * - lone `max-` / `min-` / `w-` / `h-` / `p-` / `m-` / `gap-` / `print-`
 * - token ending with bare `-` (incomplete scale)
 * - trailing breakpoint/`print` prefix with bare `:` and no utility (`xl:`, `print:`)
 */
const TRUNCATED_TOKEN_PATTERN =
  /^(?:max|min|w|h|p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|space-x|space-y|print)-$|^(?:sm|md|lg|xl|2xl|print):$/u;

const extractTemplateBlocks = (content: string): string => {
  const templateStart = content.indexOf("<template>");
  if (templateStart < 0) return "";
  const templateEnd = content.lastIndexOf("</template>");
  if (templateEnd <= templateStart) return content.slice(templateStart);
  return content.slice(templateStart, templateEnd + "</template>".length);
};

export const isTruncatedClassToken = (token: string): boolean => {
  if (token.length === 0) return false;
  if (TRUNCATED_TOKEN_PATTERN.test(token)) return true;
  const segments = token.split(":");
  const last = segments[segments.length - 1] ?? "";
  if (last.length > 0 && /^(?:max|min|w|h|p|m|gap|print)-$/u.test(last)) return true;
  if (segments.length > 1 && last.length === 0) return true;
  return false;
};

const collectTokensFromClassList = (classList: string): string[] =>
  classList.split(WHITESPACE_PATTERN).filter((token) => token.length > 0);

const collectClassListsFromAttribute = (isBound: boolean, rawValue: string): string[] => {
  if (!isBound) {
    return [rawValue];
  }
  const lists: string[] = [];
  NESTED_STRING_LITERAL_PATTERN.lastIndex = 0;
  for (const match of rawValue.matchAll(NESTED_STRING_LITERAL_PATTERN)) {
    lists.push(match[2] ?? "");
  }
  return lists;
};

export const collectTruncatedClassTokenViolationsForContent = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  const template = extractTemplateBlocks(content);
  if (template.length === 0) return [];
  const violations: ValidationViolation[] = [];
  const templateOffset = content.indexOf("<template>");

  CLASS_ATTRIBUTE_PATTERN.lastIndex = 0;
  for (const match of template.matchAll(CLASS_ATTRIBUTE_PATTERN)) {
    const attrName = (match[1] ?? "").toLowerCase();
    const isBound = attrName === ":class" || attrName === "v-bind:class";
    const rawValue = match[3] ?? "";
    const line = getLineFromOffset(content, (match.index ?? 0) + Math.max(0, templateOffset));
    for (const classList of collectClassListsFromAttribute(isBound, rawValue)) {
      for (const token of collectTokensFromClassList(classList)) {
        if (!isTruncatedClassToken(token)) continue;
        violations.push({
          filePath,
          line,
          message: `Truncated / incomplete class token "${token}". Complete the Tailwind utility or remove the dead fragment.`,
        });
      }
    }
  }

  return violations;
};

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const files = await collectProjectFileEntries({
    scanRoots,
    allowedExtensions: sourceExtensions,
  });
  return files.flatMap(({ filePath, content }) =>
    collectTruncatedClassTokenViolationsForContent(filePath, content),
  );
};

if (import.meta.main) {
  await reportViolations(
    "UI truncated class token validation failed:",
    await collectViolations(),
    "UI truncated class token validation passed.",
  );
}
