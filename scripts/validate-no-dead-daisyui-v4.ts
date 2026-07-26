import {
  collectProjectFileEntries,
  getLineFromOffset,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

/**
 * Ban daisyUI v4 class names removed/renamed in v5 (brutalise UI005).
 */

const scanRoots = ["packages/client"] as const;
const sourceExtensions = new Set([".vue", ".ts", ".css"]);

const deadDaisyUiV4Pattern =
  /\b(?:btn-group|input-group|form-control|tabs-bordered|tabs-lifted|tabs-boxed|card-bordered|input-bordered|select-bordered|textarea-bordered|btn-bordered|btm-nav|card-compact|artboard)\b/gu;

/**
 * v5 also renamed several *bare* v4 modifiers (`avatar online` →
 * `avatar avatar-online`). Those are invisible to a word-boundary scan: the
 * words are ordinary English and appear legitimately as props, attributes and
 * i18n copy. They are the dangerous half of the rename because the dead class
 * matches no CSS at all, so the component silently loses its layout rather
 * than erroring. Detect them only inside a class list that also carries the
 * owning component class.
 */
const CLASS_ATTRIBUTE_PATTERN = /(?::class|\bclass)\s*=\s*"([^"]*)"/gu;
const CLASS_TOKEN_PATTERN = /[A-Za-z][\w:-]*/gu;
const BARE_MODIFIER_RENAMES_BY_OWNER = [
  {
    owner: "avatar",
    renames: new Map([
      ["online", "avatar-online"],
      ["offline", "avatar-offline"],
      ["placeholder", "avatar-placeholder"],
    ]),
  },
  {
    owner: "menu",
    renames: new Map([
      ["active", "menu-active"],
      ["disabled", "menu-disabled"],
      ["focus", "menu-focus"],
    ]),
  },
] as const;

const collectOwnerRenameViolations = (
  filePath: string,
  content: string,
  attributeIndex: number,
  tokens: ReadonlySet<string>,
  owner: string,
  renames: ReadonlyMap<string, string>,
): ValidationViolation[] => {
  if (!tokens.has(owner)) {
    return [];
  }
  const violations: ValidationViolation[] = [];
  for (const [deadToken, replacement] of renames) {
    if (!tokens.has(deadToken)) {
      continue;
    }
    violations.push({
      filePath,
      line: getLineFromOffset(content, attributeIndex),
      message: `Dead daisyUI v4 modifier "${deadToken}" on a "${owner}" element is forbidden — it matches no v5 CSS, so the component silently loses its layout. Use "${replacement}".`,
    });
  }
  return violations;
};

const collectBareModifierViolations = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  const violations: ValidationViolation[] = [];
  CLASS_ATTRIBUTE_PATTERN.lastIndex = 0;
  for (const attributeMatch of content.matchAll(CLASS_ATTRIBUTE_PATTERN)) {
    const attributeValue = attributeMatch[1] ?? "";
    const tokens = new Set(attributeValue.match(CLASS_TOKEN_PATTERN) ?? []);
    for (const { owner, renames } of BARE_MODIFIER_RENAMES_BY_OWNER) {
      violations.push(
        ...collectOwnerRenameViolations(
          filePath,
          content,
          attributeMatch.index ?? 0,
          tokens,
          owner,
          renames,
        ),
      );
    }
  }
  return violations;
};

export const collectDeadDaisyUiV4ViolationsForContent = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  const violations: ValidationViolation[] = [];
  deadDaisyUiV4Pattern.lastIndex = 0;
  for (const match of content.matchAll(deadDaisyUiV4Pattern)) {
    violations.push({
      filePath,
      line: getLineFromOffset(content, match.index ?? 0),
      message: `Dead daisyUI v4 class "${match[0]}" is forbidden. Use daisyUI v5 contracts (join/fieldset/tabs / default borders).`,
    });
  }
  violations.push(...collectBareModifierViolations(filePath, content));
  return violations;
};

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const files = await collectProjectFileEntries({
    scanRoots: [...scanRoots],
    allowedExtensions: sourceExtensions,
  });
  return files.flatMap(({ filePath, content }) =>
    collectDeadDaisyUiV4ViolationsForContent(filePath, content),
  );
};

if (import.meta.main) {
  await reportViolations(
    "Dead daisyUI v4 class validation failed:",
    await collectViolations(),
    "Dead daisyUI v4 class validation passed.",
  );
}
