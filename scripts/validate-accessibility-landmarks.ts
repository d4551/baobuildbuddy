import {
  collectProjectFileEntries,
  getLineFromOffset,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

const layoutRequirements = [
  "packages/client/layouts/default.vue",
  "packages/client/layouts/auth-shell.vue",
] as const;
const pageFilePattern = /^packages\/client\/pages\/.+\.vue$/u;
const pageScaffoldTagPattern = /<PageScaffold\b([\s\S]*?)>/gu;
const pageScaffoldLabelledByPattern = /\blabelled-by\s*=\s*["']([^"']+)["']/u;
const pageScaffoldMainPattern = /\btag\s*=\s*["']main["']/u;
const titleIdPattern = /\btitle-id\s*=\s*["']([^"']+)["']/gu;
const headingIdPattern = /<h1\b[^>]*\bid\s*=\s*["']([^"']+)["']/gu;
const mainTagPattern = /<main\b/gu;

const collectLayoutViolations = (filePath: string, content: string): ValidationViolation[] => {
  const mainCount = [...content.matchAll(mainTagPattern)].length;
  if (mainCount === 1) {
    return [];
  }

  return [
    {
      filePath,
      line: 1,
      message:
        mainCount === 0
          ? "Layouts must expose exactly one main landmark."
          : "Layouts must not expose more than one main landmark.",
    },
  ] satisfies ValidationViolation[];
};

const collectPageHeadingTargets = (content: string): Set<string> => {
  const targets = new Set<string>();

  for (const match of content.matchAll(titleIdPattern)) {
    const titleId = match[1];
    if (titleId) {
      targets.add(titleId);
    }
  }

  for (const match of content.matchAll(headingIdPattern)) {
    const headingId = match[1];
    if (headingId) {
      targets.add(headingId);
    }
  }

  return targets;
};

export const collectAccessibilityLandmarkViolationsForContent = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (layoutRequirements.includes(filePath as (typeof layoutRequirements)[number])) {
    return collectLayoutViolations(filePath, content);
  }

  if (!pageFilePattern.test(filePath)) {
    return [];
  }

  const violations: ValidationViolation[] = [];
  const pageHeadingTargets = collectPageHeadingTargets(content);

  for (const match of content.matchAll(pageScaffoldTagPattern)) {
    const scaffoldMarkup = match[0] ?? "";
    const scaffoldOffset = match.index ?? 0;
    const line = getLineFromOffset(content, scaffoldOffset);

    if (pageScaffoldMainPattern.test(scaffoldMarkup)) {
      violations.push({
        filePath,
        line,
        message:
          'Routed pages must not declare `PageScaffold tag="main"`; layouts own the single main landmark.',
      });
    }

    const labelledByMatch = pageScaffoldLabelledByPattern.exec(scaffoldMarkup);
    if (!labelledByMatch) {
      violations.push({
        filePath,
        line,
        message:
          "PageScaffold must provide a static `labelled-by` target so the routed screen exposes a named landmark.",
      });
      continue;
    }

    const labelledByTarget = labelledByMatch[1];
    if (!pageHeadingTargets.has(labelledByTarget)) {
      violations.push({
        filePath,
        line,
        message: `PageScaffold labelled-by target "${labelledByTarget}" must match a shared page heading id or title-id.`,
      });
    }
  }

  return violations;
};

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const entries = await collectProjectFileEntries({
    scanRoots: ["packages/client/layouts", "packages/client/pages"],
    allowedExtensions: new Set([".vue"]),
  });

  return entries.flatMap(({ filePath, content }) =>
    collectAccessibilityLandmarkViolationsForContent(filePath, content),
  );
};

if (import.meta.main) {
  await reportViolations(
    "Accessibility landmark validation failed:",
    await collectViolations(),
    "Accessibility landmark validation passed.",
  );
}
