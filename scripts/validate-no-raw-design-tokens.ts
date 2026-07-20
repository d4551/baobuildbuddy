import { isControlPrimitiveOwner } from "./ui-control-primitive-owners";
import { isUiSsotAuthority } from "./ui-ssot-authority";
import {
  collectProjectFileEntries,
  getLineFromOffset,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

const sourceExtensions = new Set([".vue", ".ts", ".css"]);
const scanRoots = ["packages/client"] as const;

const isSsotSourceFile = (filePath: string): boolean =>
  isUiSsotAuthority(filePath) || isControlPrimitiveOwner(filePath);
const isIconPrimitive = (filePath: string): boolean =>
  filePath.startsWith("packages/client/components/icons/");

const rawPalettePattern =
  /\b(?:bg|text|border|from|to|via|ring|stroke|fill)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]{2,3}\b/gu;
const rawMonochromePalettePattern = /\b(?:bg|text|border|fill)-(?:white|black)\b/gu;
const hexColorLiteralPattern = /#[0-9a-fA-F]{3,8}\b/gu;
const cssColorFunctionPattern = /\b(?:rgb|rgba|hsl|hsla|oklch)\s*\(/gu;

const arbitraryTokenPattern =
  /\b(?:p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|space-x|space-y|w|h|min-w|min-h|max-w|max-h|rounded|shadow)-\[[^\]]+\]/gu;

const inlineUtilityTokenPattern =
  /\b(?:p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|space-x|space-y|w|h|min-w|min-h|max-w|max-w|rounded)-(?:xs|sm|md|lg|xl|2xl|3xl|full|\d{1,3})\b/gu;
const inlineShadowTokenPattern = /\bshadow-(?:xs|sm|md|lg|xl|2xl|inner|none)\b/gu;
const inlineRadiusTokenPattern = /\brounded-(?:sm|md|lg|xl|2xl|3xl|full)\b/gu;
const inlineTypographyScalePattern =
  /\btext-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)\b/gu;
const inlineResponsiveBreakpointBypassPattern =
  /\b(?:sm|md|lg|xl|2xl):(?:p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|w|h|min-w|min-h|max-w|rounded|shadow|text)-[a-z0-9]+/gu;

const staticClassAttributePattern = /\bclass\s*=\s*["']([^"']+)["']/gu;
const dynamicClassBindingPattern = /:class\s*=\s*["']([^"']+)["']/gu;
const classTokenSplitPattern = /\s+/u;
const designTokenPropDefaultPattern =
  /\b(?:sizeClass|trackClass|fillClass|widthClass|heightClass|radiusClass|spacingClass|paddingClass|gapClass)\s*:\s*["']([^"']+)["']/gu;

const svgNumericAttributePattern =
  /\b(?:stroke-width|width|height)\s*=\s*["'](\d+(?:\.\d+)?)["']/gu;

const extractTemplateBlocks = (content: string): string => {
  const templateStart = content.indexOf("<template>");
  if (templateStart < 0) return "";
  const templateEnd = content.lastIndexOf("</template>");
  if (templateEnd <= templateStart) return content.slice(templateStart);
  return content.slice(templateStart, templateEnd + "</template>".length);
};

const collectClassAttributeViolations = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  const violations: ValidationViolation[] = [];
  const patterns: Array<{ pattern: RegExp; message: (token: string) => string }> = [
    {
      pattern: rawPalettePattern,
      message: (token) =>
        `Raw Tailwind palette token "${token}" is forbidden. Use semantic daisyUI tokens or shared constants.`,
    },
    {
      pattern: rawMonochromePalettePattern,
      message: (token) =>
        `Raw monochrome palette token "${token}" is forbidden. Use bg-base-100 / text-base-content / text-muted semantic tokens.`,
    },
    {
      pattern: arbitraryTokenPattern,
      message: (token) =>
        `Arbitrary design token "${token}" is forbidden. Use the shared spacing and sizing scale.`,
    },
    {
      pattern: inlineUtilityTokenPattern,
      message: (token) =>
        `Inline utility token "${token}" is forbidden outside SSOT source. Add it to constants/layout.ts or constants/ui-layout.ts and reference the exported constant.`,
    },
    {
      pattern: inlineShadowTokenPattern,
      message: (token) =>
        `Inline shadow token "${token}" is forbidden. Use the .glass-* / --glass-shadow-* token system from main.css or a shared layout constant.`,
    },
    {
      pattern: inlineRadiusTokenPattern,
      message: (token) =>
        `Inline radius token "${token}" is forbidden. Use --radius-* CSS variables or a shared layout constant.`,
    },
    {
      pattern: inlineTypographyScalePattern,
      message: (token) =>
        `Inline typography scale token "${token}" is forbidden. Use a shared typography constant or semantic daisyUI class (text-base-content, text-muted, text-secondary).`,
    },
  ];

  const scanClassValue = (classValue: string, baseLine: number): void => {
    // Match whole utility tokens only — avoid false positives like
    // `max-h-72` → `h-72`, `scroll-mt-24` → `mt-24`, `mt-0.5` → `mt-0`.
    const classTokens = classValue.split(classTokenSplitPattern).filter((token) => token.length > 0);
    for (const token of classTokens) {
      if (
        token.includes("text-base") ||
        token.includes("text-muted") ||
        token.includes("text-secondary") ||
        token.includes("text-primary")
      ) {
        continue;
      }
      for (const { pattern, message } of patterns) {
        pattern.lastIndex = 0;
        const match = pattern.exec(token);
        if (match && match[0] === token) {
          violations.push({ filePath, line: baseLine, message: message(token) });
          break;
        }
      }
    }
  };

  staticClassAttributePattern.lastIndex = 0;
  for (const classMatch of content.matchAll(staticClassAttributePattern)) {
    scanClassValue(classMatch[1] ?? "", getLineFromOffset(content, classMatch.index ?? 0));
  }

  dynamicClassBindingPattern.lastIndex = 0;
  for (const classMatch of content.matchAll(dynamicClassBindingPattern)) {
    const bindingValue = classMatch[1] ?? "";
    const baseLine = getLineFromOffset(content, classMatch.index ?? 0);
    const stringLiteralMatches = bindingValue.matchAll(/["']([^"']+)["']/gu);
    for (const strMatch of stringLiteralMatches) {
      scanClassValue(strMatch[1] ?? "", baseLine);
    }
  }

  return violations;
};

const collectResponsiveBypassViolations = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (isSsotSourceFile(filePath)) return [];
  const violations: ValidationViolation[] = [];
  inlineResponsiveBreakpointBypassPattern.lastIndex = 0;
  for (const match of content.matchAll(inlineResponsiveBreakpointBypassPattern)) {
    violations.push({
      filePath,
      line: getLineFromOffset(content, match.index ?? 0),
      message: `Responsive breakpoint utility "${match[0]}" bypasses the SSOT responsive token system. Add it to constants/ui-layout.ts as a UiGridToken/UiWidthToken/UiSpacingToken and reference the exported constant.`,
    });
  }
  return violations;
};

const collectDesignTokenPropDefaultViolations = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (isSsotSourceFile(filePath)) return [];
  const violations: ValidationViolation[] = [];
  designTokenPropDefaultPattern.lastIndex = 0;
  for (const match of content.matchAll(designTokenPropDefaultPattern)) {
    const value = match[1] ?? "";
    inlineUtilityTokenPattern.lastIndex = 0;
    if (inlineUtilityTokenPattern.test(value)) {
      violations.push({
        filePath,
        line: getLineFromOffset(content, match.index ?? 0),
        message: `Design-token prop default "${value}" bakes in inline utility tokens. Import the size/radius/spacing constant from constants/layout.ts and use it as the default.`,
      });
    }
  }
  return violations;
};

const collectSvgNumericAttributeViolations = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (isSsotSourceFile(filePath) || isIconPrimitive(filePath)) return [];
  const template = extractTemplateBlocks(content);
  if (template.length === 0) return [];
  const violations: ValidationViolation[] = [];
  svgNumericAttributePattern.lastIndex = 0;
  for (const match of template.matchAll(svgNumericAttributePattern)) {
    violations.push({
      filePath,
      line: getLineFromOffset(content, match.index ?? 0),
      message: `Hardcoded SVG numeric attribute "${match[0]}" is forbidden. Extract stroke-width / width / height into a named constant in constants/layout.ts or the component's primitive contract.`,
    });
  }
  return violations;
};

const collectColorLiteralViolations = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (isSsotSourceFile(filePath)) return [];
  if (!filePath.endsWith(".css") && !filePath.endsWith(".vue") && !filePath.endsWith(".ts")) {
    return [];
  }
  const violations: ValidationViolation[] = [];
  hexColorLiteralPattern.lastIndex = 0;
  for (const match of content.matchAll(hexColorLiteralPattern)) {
    violations.push({
      filePath,
      line: getLineFromOffset(content, match.index ?? 0),
      message: `Hex color literal "${match[0]}" is forbidden. Use daisyUI semantic tokens (bg-base-*, text-base-content, text-muted, text-secondary, text-primary) or the main.css oklch() token system.`,
    });
  }
  cssColorFunctionPattern.lastIndex = 0;
  for (const match of content.matchAll(cssColorFunctionPattern)) {
    if (filePath.endsWith(".css") && isSsotSourceFile(filePath)) continue;
    violations.push({
      filePath,
      line: getLineFromOffset(content, match.index ?? 0),
      message: `CSS color function "${match[0]}" is forbidden outside main.css. Use daisyUI semantic tokens or the main.css token system.`,
    });
  }
  return violations;
};

const scriptSizingLiteralPattern =
  /["'`]((?:h|w|min-h|min-w|max-h|max-w)-(?:xs|sm|md|lg|xl|\d{1,3})(?:\s+(?:h|w|min-h|min-w|max-h|max-w)-(?:xs|sm|md|lg|xl|\d{1,3}))+)["'`]/gu;

const collectScriptSizingLiteralViolations = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (isSsotSourceFile(filePath) || isIconPrimitive(filePath)) return [];
  if (filePath.endsWith(".test.ts") || filePath.endsWith(".spec.ts")) return [];
  if (!(filePath.endsWith(".vue") || filePath.endsWith(".ts"))) return [];
  const violations: ValidationViolation[] = [];
  scriptSizingLiteralPattern.lastIndex = 0;
  for (const match of content.matchAll(scriptSizingLiteralPattern)) {
    const token = match[1] ?? match[0];
    violations.push({
      filePath,
      line: getLineFromOffset(content, match.index ?? 0),
      message: `Script sizing literal "${token}" is forbidden. Use ICON_SIZE_CLASS / layout size tokens.`,
    });
  }
  return violations;
};

export const collectRawDesignTokenViolationsForContent = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (isSsotSourceFile(filePath)) return [];
  const templateContent = extractTemplateBlocks(content);
  const classViolations =
    templateContent.length > 0 ? collectClassAttributeViolations(filePath, content) : [];
  const responsiveViolations = collectResponsiveBypassViolations(filePath, content);
  const propDefaultViolations = collectDesignTokenPropDefaultViolations(filePath, content);
  const svgViolations = collectSvgNumericAttributeViolations(filePath, content);
  const colorViolations = collectColorLiteralViolations(filePath, content);
  const scriptSizingViolations = collectScriptSizingLiteralViolations(filePath, content);
  return [
    ...classViolations,
    ...responsiveViolations,
    ...propDefaultViolations,
    ...svgViolations,
    ...colorViolations,
    ...scriptSizingViolations,
  ];
};

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const files = await collectProjectFileEntries({
    scanRoots,
    allowedExtensions: sourceExtensions,
  });
  return files.flatMap(({ filePath, content }) =>
    collectRawDesignTokenViolationsForContent(filePath, content),
  );
};

if (import.meta.main) {
  await reportViolations(
    "Raw design token validation failed:",
    await collectViolations(),
    "Raw design token validation passed.",
  );
}
