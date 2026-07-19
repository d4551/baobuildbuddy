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
const errorPagePath = "packages/client/error.vue";
const pageFilePattern = /^packages\/client\/pages\/.+\.vue$/u;
const pageScaffoldTagPattern = /<PageScaffold\b([\s\S]*?)>/gu;
const pageScaffoldLabelledByPattern = /\blabelled-by\s*=\s*["']([^"']+)["']/u;
const pageScaffoldMainPattern = /\btag\s*=\s*["']main["']/u;
const titleIdPattern = /\btitle-id\s*=\s*["']([^"']+)["']/gu;
const headingIdPattern = /<h1\b[^>]*\bid\s*=\s*["']([^"']+)["']/gu;
const mainTagPattern = /<main\b/gu;
const skipLinkPattern =
  /<a\b[^>]*?(?::href|v-bind:href|\shref)\s*=\s*["'][^"']*(?:#main-content|APP_MAIN_CONTENT_ID)[^"']*["']/u;
const mainTagWithAttributesPattern = /<main\b[^>]*>/gu;
const mainTabindexPattern = /tabindex\s*=\s*["']-1["']/u;
const mainIdPattern = /(?::id|v-bind:id|\sid)\s*=\s*["'](?:main-content|APP_MAIN_CONTENT_ID)["']/u;

const collectLayoutViolations = (filePath: string, content: string): ValidationViolation[] => {
  const violations: ValidationViolation[] = [];
  const mainCount = [...content.matchAll(mainTagPattern)].length;
  if (mainCount !== 1) {
    violations.push({
      filePath,
      line: 1,
      message:
        mainCount === 0
          ? "Layouts must expose exactly one main landmark."
          : "Layouts must not expose more than one main landmark.",
    });
  }

  if (skipLinkPattern.test(content)) {
    for (const mainMatch of content.matchAll(mainTagWithAttributesPattern)) {
      const mainMarkup = mainMatch[0];
      if (!mainIdPattern.test(mainMarkup)) {
        continue;
      }
      if (!mainTabindexPattern.test(mainMarkup)) {
        violations.push({
          filePath,
          line: getLineFromOffset(content, mainMatch.index ?? 0),
          message:
            'Skip-link target <main id="main-content"> must include tabindex="-1" so focus can move to it (WCAG 2.4.1).',
        });
      }
    }
  }

  return violations;
};

const collectErrorPageViolations = (content: string): ValidationViolation[] => {
  const violations: ValidationViolation[] = [];
  const mainCount = [...content.matchAll(mainTagPattern)].length;
  if (mainCount !== 1) {
    violations.push({
      filePath: errorPagePath,
      line: 1,
      message:
        mainCount === 0
          ? "The error page must expose exactly one <main> landmark."
          : "The error page must not expose more than one <main> landmark.",
    });
  }

  if (!skipLinkPattern.test(content)) {
    violations.push({
      filePath: errorPagePath,
      line: 1,
      message:
        "The error page must include a skip link to #main-content so keyboard users can bypass the chrome (WCAG 2.4.1).",
    });
  }

  if (skipLinkPattern.test(content) && mainCount === 1) {
    for (const mainMatch of content.matchAll(mainTagWithAttributesPattern)) {
      const mainMarkup = mainMatch[0];
      if (!mainIdPattern.test(mainMarkup)) {
        continue;
      }
      if (!mainTabindexPattern.test(mainMarkup)) {
        violations.push({
          filePath: errorPagePath,
          line: getLineFromOffset(content, mainMatch.index ?? 0),
          message:
            'Error-page skip-link target <main id="main-content"> must include tabindex="-1" (WCAG 2.4.1).',
        });
      }
    }
  }

  return violations;
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

  if (filePath === errorPagePath) {
    return collectErrorPageViolations(content);
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
  const errorPageEntry = await Bun.file(errorPagePath).text();
  const allEntries = [...entries, { filePath: errorPagePath, content: errorPageEntry }];

  return allEntries.flatMap(({ filePath, content }) =>
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
