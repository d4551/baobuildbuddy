import {
  collectProjectFileEntries,
  getLineFromOffset,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

/**
 * Inline `style="..."` attributes are forbidden in Vue templates.
 * They bypass the layout/CSS SSOT token system, defeat theming, and create
 * per-component bespoke styling (design.md §8 / AGENTS.md UI/UX standards).
 *
 * This gate catches real `style="..."` attributes on element tags. It excludes
 * Vue event/handler bindings like `@update:conversation-style="..."` which
 * contain the substring `style=` but are not inline style attributes.
 *
 * Script/DOM style writes (`.style.*`, `setAttribute("style", ...)`) are also
 * banned except for the brand CSS variable allowlist below.
 */

const scanRoots = ["packages/client"] as const;
const sourceExtensions = new Set([".vue", ".ts", ".tsx", ".js", ".mjs", ".cjs"]);

const BRAND_STYLE_DOM_ALLOWLIST = new Set([
  "packages/client/plugins/brand-css.client.ts",
  "packages/client/composables/useBrandPreviewStyles.ts",
]);

// Match a real inline style attribute: `<tag ... style="..."` or `<tag ... style='...'`.
// Must be preceded by whitespace + attribute name boundary, and the value is
// quoted. This excludes `@update:conversation-style="..."` (preceded by `-`
// not whitespace) and `:style="..."` (Vue dynamic binding — handled by the
// dynamic binding gate separately, but also banned here).
const inlineStyleAttributePattern = /\sstyle\s*=\s*(?:"[^"]*"|'[^']*'|`[^`]*`)/gu;
const dynamicStyleBindingPattern = /:style\s*=\s*(?:"[^"]*"|'[^']*'|`[^`]*`)/gu;
const stylePropertyWritePattern = /\.style\./gu;
const setAttributeStylePattern = /setAttribute\s*\(\s*(["'])style\1/gu;

const extractTemplateBlocks = (content: string): string => {
  const templateStart = content.indexOf("<template>");
  if (templateStart < 0) return "";
  const templateEnd = content.lastIndexOf("</template>");
  if (templateEnd <= templateStart) return content.slice(templateStart);
  return content.slice(templateStart, templateEnd + "</template>".length);
};

export const collectInlineStyleViolationsForContent = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  const violations: ValidationViolation[] = [];
  const template = extractTemplateBlocks(content);

  if (template.length > 0) {
    inlineStyleAttributePattern.lastIndex = 0;
    for (const match of template.matchAll(inlineStyleAttributePattern)) {
      violations.push({
        filePath,
        line: getLineFromOffset(content, match.index ?? 0),
        message: `Inline style attribute "style=..." is forbidden. Use SSOT tokens from constants/layout.ts or assets/css/main.css glass-* primitives.`,
      });
    }

    dynamicStyleBindingPattern.lastIndex = 0;
    for (const match of template.matchAll(dynamicStyleBindingPattern)) {
      violations.push({
        filePath,
        line: getLineFromOffset(content, match.index ?? 0),
        message: `Dynamic :style binding is forbidden. Use :class with SSOT class constants from constants/layout.ts. Inline styles bypass the glassmorphic token system.`,
      });
    }
  }

  if (!BRAND_STYLE_DOM_ALLOWLIST.has(filePath)) {
    stylePropertyWritePattern.lastIndex = 0;
    for (const match of content.matchAll(stylePropertyWritePattern)) {
      violations.push({
        filePath,
        line: getLineFromOffset(content, match.index ?? 0),
        message:
          "DOM style property write (`.style.`) is forbidden outside brand CSS allowlist. Use SSOT class tokens or brand-css.client.ts / useBrandPreviewStyles.ts.",
      });
    }

    setAttributeStylePattern.lastIndex = 0;
    for (const match of content.matchAll(setAttributeStylePattern)) {
      violations.push({
        filePath,
        line: getLineFromOffset(content, match.index ?? 0),
        message:
          'setAttribute("style", ...) is forbidden outside brand CSS allowlist. Use SSOT class tokens.',
      });
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
    collectInlineStyleViolationsForContent(filePath, content),
  );
};

if (import.meta.main) {
  await reportViolations(
    "Inline style validation failed:",
    await collectViolations(),
    "Inline style validation passed.",
  );
}
