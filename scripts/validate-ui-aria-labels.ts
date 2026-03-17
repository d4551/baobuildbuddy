import { writeError, writeOutput } from "./utils/cli-output";
import { getLineFromOffset, shouldIgnorePath } from "./utils/validation-helpers";

type Violation = {
  filePath: string;
  line: number;
  tagName: string;
  message: string;
};

const projectRoot = process.cwd();
const clientRoot = "packages/client";
const interactiveRoleNames = ["button", "menuitem", "menuitemradio", "menuitemcheckbox"] as const;
const formControlTagNames = ["input", "select", "textarea"] as const;
const accessibleNameAttributePattern = /(?:\s|:|v-bind:)(?:aria-label|aria-labelledby|title)\s*=/u;
const dialogModalPattern = /(?:\s|:|v-bind:)aria-modal\s*=\s*["']true["']/u;
const hiddenInputPattern = /type\s*=\s*["']hidden["']/u;
const ariaHiddenElementPattern = /aria-hidden\s*=\s*["']true["']/u;
const ariaControlsPattern = /(?:\s|:|v-bind:)aria-controls\s*=/u;
const menuRolePattern = /role\s*=\s*["']menu["']/u;
const menuItemRolePattern = /role\s*=\s*["']menuitem(?:radio|checkbox)?["']/u;
const templateInterpolationPattern = /\{\{[\s\S]*?\}\}/gu;
const markupPattern = /<[^>]+>/gu;
const whitespacePattern = /\s+/gu;
const tagNamePattern = /^<([a-zA-Z0-9:-]+)/;
const roleAttributePattern = /role\s*=\s*["']([^"']+)["']/u;

const interactiveRolePattern = new RegExp(
  `<[^>]+role\\s*=\\s*["'](?:${interactiveRoleNames.join("|")})["'][^>]*>`,
  "gu",
);
const tabindexPattern = /<[^>]+tabindex\s*=\s*["']?-?\d+["']?[^>]*>/gu;
const menuTriggerPattern = /<[^>]+aria-haspopup\s*=\s*["']menu["'][^>]*>/gu;
const dialogTagPattern = /<dialog\b[\s\S]*?>/gu;
const iconOnlyControlPattern = /<(button|a|NuxtLink|summary)\b[\s\S]*?>([\s\S]*?)<\/\1>/gu;
const detailsBlockPattern = /<details\b[\s\S]*?<\/details>/gu;
const labelControlPattern = /<label\b[\s\S]*?>/gu;
const tabListBlockPattern = /<[^>]+role\s*=\s*["']tablist["'][^>]*>[\s\S]*?<\/div>/gu;
const tabButtonPattern = /<button\b[\s\S]*?role\s*=\s*["']tab["'][\s\S]*?>/gu;
const tabPanelTagPattern = /<[^>]+role\s*=\s*["']tabpanel["'][^>]*>/gu;
const boundIdAttributePattern = /(?:\s|:|v-bind:)id\s*=/u;
const boundAriaLabelledByPattern = /(?:\s|:|v-bind:)aria-labelledby\s*=/u;
const buttonLikeLabelPattern = /(?:drawer-overlay|drawer-button|\bbtn\b)/u;
const tabindexAttributePattern = /tabindex\s*=/u;
const conditionalTabPanelPattern = /v-if\s*=|v-else-if\s*=/u;
const ariaCurrentPattern = /aria-current\s*=/u;
const pageButtonPattern =
  /<button\b[\s\S]*?v-for\s*=\s*["'][^"']*page[^"']*["'][\s\S]*?:class\s*=\s*["'][^"']*btn-active[^"']*["'][\s\S]*?>/gu;
const arrowMenuKeyPattern = /ArrowDown|ArrowUp/u;

const hasAccessibleNameAttribute = (tagMarkup: string): boolean =>
  accessibleNameAttributePattern.test(tagMarkup);

const isHiddenInput = (tagMarkup: string): boolean => hiddenInputPattern.test(tagMarkup);

const isAriaHiddenElement = (tagMarkup: string): boolean =>
  ariaHiddenElementPattern.test(tagMarkup);

const extractTagName = (tagMarkup: string): string => {
  const tagNameMatch = tagNamePattern.exec(tagMarkup);
  return tagNameMatch?.[1]?.toLowerCase() ?? "unknown";
};

const isNativeFocusableTag = (tagName: string): boolean =>
  ["a", "button", "input", "select", "summary", "textarea", "nuxtlink"].includes(tagName);

const isAllowedInteractiveRoleTag = (tagName: string, roleName: string): boolean => {
  if (roleName === "button") {
    return ["a", "button", "nuxtlink", "summary"].includes(tagName);
  }

  return ["a", "button", "nuxtlink"].includes(tagName);
};

const stripMarkupToText = (content: string): string =>
  content
    .replace(templateInterpolationPattern, " dynamic-text ")
    .replace(markupPattern, " ")
    .replace(whitespacePattern, " ")
    .trim();

const collectVueFiles = async (): Promise<string[]> => {
  const files: string[] = [];
  const glob = new Bun.Glob(`${clientRoot}/**/*.vue`);

  for await (const relativeFilePath of glob.scan({ cwd: projectRoot, onlyFiles: true })) {
    const normalizedPath = relativeFilePath.replace(/\\/gu, "/");
    if (shouldIgnorePath(normalizedPath)) {
      continue;
    }
    files.push(normalizedPath);
  }

  return files;
};

const collectFormControlViolations = (
  filePath: string,
  fileContent: string,
  tagName: "input" | "select" | "textarea",
): Violation[] => {
  const violations: Violation[] = [];
  const tagPattern = new RegExp(`<${tagName}\\b[\\s\\S]*?>`, "gu");

  for (const match of fileContent.matchAll(tagPattern)) {
    const tagMarkup = match[0];
    if (isAriaHiddenElement(tagMarkup)) {
      continue;
    }
    if (tagName === "input" && isHiddenInput(tagMarkup)) {
      continue;
    }
    if (hasAccessibleNameAttribute(tagMarkup)) {
      continue;
    }

    violations.push({
      filePath,
      line: getLineFromOffset(fileContent, match.index ?? 0),
      tagName,
      message: "Form controls must include aria-label or aria-labelledby.",
    });
  }

  return violations;
};

const collectDialogViolations = (filePath: string, fileContent: string): Violation[] => {
  const violations: Violation[] = [];

  for (const match of fileContent.matchAll(dialogTagPattern)) {
    const tagMarkup = match[0];
    if (!hasAccessibleNameAttribute(tagMarkup)) {
      violations.push({
        filePath,
        line: getLineFromOffset(fileContent, match.index ?? 0),
        tagName: "dialog",
        message: "Dialogs must include aria-label or aria-labelledby.",
      });
    }
    if (!dialogModalPattern.test(tagMarkup)) {
      violations.push({
        filePath,
        line: getLineFromOffset(fileContent, match.index ?? 0),
        tagName: "dialog",
        message: 'Dialogs must include aria-modal="true".',
      });
    }
  }

  return violations;
};

const collectInteractiveRoleViolations = (filePath: string, fileContent: string): Violation[] => {
  const violations: Violation[] = [];

  for (const match of fileContent.matchAll(interactiveRolePattern)) {
    const tagMarkup = match[0];
    if (isAriaHiddenElement(tagMarkup)) {
      continue;
    }

    const tagName = extractTagName(tagMarkup);
    const roleMatch = roleAttributePattern.exec(tagMarkup);
    const roleName = roleMatch?.[1] ?? "";
    if (isAllowedInteractiveRoleTag(tagName, roleName)) {
      continue;
    }

    violations.push({
      filePath,
      line: getLineFromOffset(fileContent, match.index ?? 0),
      tagName,
      message: `Use native buttons or links instead of ${roleName} on generic containers.`,
    });
  }

  return violations;
};

const collectFocusableViolations = (filePath: string, fileContent: string): Violation[] => {
  const violations: Violation[] = [];

  for (const match of fileContent.matchAll(tabindexPattern)) {
    const tagMarkup = match[0];
    if (isAriaHiddenElement(tagMarkup)) {
      continue;
    }
    if (menuRolePattern.test(tagMarkup)) {
      continue;
    }

    const tagName = extractTagName(tagMarkup);
    if (isNativeFocusableTag(tagName)) {
      continue;
    }

    violations.push({
      filePath,
      line: getLineFromOffset(fileContent, match.index ?? 0),
      tagName,
      message: "Focusable non-native containers must be replaced with native controls.",
    });
  }

  return violations;
};

const collectMenuTriggerViolations = (filePath: string, fileContent: string): Violation[] => {
  const violations: Violation[] = [];

  for (const match of fileContent.matchAll(menuTriggerPattern)) {
    const tagMarkup = match[0];
    if (ariaControlsPattern.test(tagMarkup)) {
      continue;
    }

    violations.push({
      filePath,
      line: getLineFromOffset(fileContent, match.index ?? 0),
      tagName: extractTagName(tagMarkup),
      message: "Menu triggers must connect to their menu with aria-controls.",
    });
  }

  return violations;
};

const collectDisclosureMenuViolations = (filePath: string, fileContent: string): Violation[] => {
  const violations: Violation[] = [];

  for (const match of fileContent.matchAll(detailsBlockPattern)) {
    const detailsMarkup = match[0];
    if (!(menuRolePattern.test(detailsMarkup) || menuItemRolePattern.test(detailsMarkup))) {
      continue;
    }

    violations.push({
      filePath,
      line: getLineFromOffset(fileContent, match.index ?? 0),
      tagName: "details",
      message:
        "Dropdowns built with details/summary must use disclosure semantics instead of ARIA menu roles.",
    });
  }

  return violations;
};

const collectLabelControlViolations = (filePath: string, fileContent: string): Violation[] => {
  const violations: Violation[] = [];

  for (const match of fileContent.matchAll(labelControlPattern)) {
    const tagMarkup = match[0];
    if (!buttonLikeLabelPattern.test(tagMarkup)) {
      continue;
    }

    violations.push({
      filePath,
      line: getLineFromOffset(fileContent, match.index ?? 0),
      tagName: "label",
      message: "Button-like drawer controls must use native buttons instead of labels.",
    });
  }

  return violations;
};

const collectTabButtonViolations = (
  filePath: string,
  fileContent: string,
  tabListMatch: RegExpMatchArray,
): Violation[] => {
  const violations: Violation[] = [];
  const tabListMarkup = tabListMatch[0];
  const tabListOffset = tabListMatch.index ?? 0;

  if (!tabButtonPattern.test(tabListMarkup)) {
    return violations;
  }

  for (const tabMatch of tabListMarkup.matchAll(tabButtonPattern)) {
    const tabMarkup = tabMatch[0];
    const line = getLineFromOffset(fileContent, tabListOffset + (tabMatch.index ?? 0));
    if (!ariaControlsPattern.test(tabMarkup)) {
      violations.push({
        filePath,
        line,
        tagName: "button",
        message: "Tabs must include aria-controls that point to a tabpanel.",
      });
    }

    if (!tabindexAttributePattern.test(tabMarkup)) {
      violations.push({
        filePath,
        line,
        tagName: "button",
        message: "Tabs must manage roving tabindex for keyboard navigation.",
      });
    }
  }

  return violations;
};

const collectTabPanelViolations = (
  filePath: string,
  fileContent: string,
  tabPanelTags: readonly RegExpMatchArray[],
): Violation[] => {
  const violations: Violation[] = [];

  for (const tabPanelMatch of tabPanelTags) {
    const tabPanelMarkup = tabPanelMatch[0];
    const line = getLineFromOffset(fileContent, tabPanelMatch.index ?? 0);
    if (!boundIdAttributePattern.test(tabPanelMarkup)) {
      violations.push({
        filePath,
        line,
        tagName: "div",
        message: "Tabpanels must expose an id referenced by their controlling tab.",
      });
    }

    if (!boundAriaLabelledByPattern.test(tabPanelMarkup)) {
      violations.push({
        filePath,
        line,
        tagName: "div",
        message: "Tabpanels must expose aria-labelledby that points back to the active tab.",
      });
    }

    if (conditionalTabPanelPattern.test(tabPanelMarkup)) {
      violations.push({
        filePath,
        line,
        tagName: "div",
        message: "Tabpanels must remain mounted and toggle visibility without v-if/v-else-if.",
      });
    }
  }

  return violations;
};

const collectTabContractViolations = (filePath: string, fileContent: string): Violation[] => {
  const violations: Violation[] = [];
  const tabLists = [...fileContent.matchAll(tabListBlockPattern)];
  if (tabLists.length === 0) {
    return violations;
  }

  for (const tabListMatch of tabLists) {
    violations.push(...collectTabButtonViolations(filePath, fileContent, tabListMatch));
  }

  const tabPanelTags = [...fileContent.matchAll(tabPanelTagPattern)];
  if (tabPanelTags.length === 0) {
    violations.push({
      filePath,
      line: getLineFromOffset(fileContent, tabLists[0]?.index ?? 0),
      tagName: "div",
      message: "Tablists must render matching tabpanel regions.",
    });
    return violations;
  }

  violations.push(...collectTabPanelViolations(filePath, fileContent, tabPanelTags));
  return violations;
};

const collectMenuKeyboardViolations = (filePath: string, fileContent: string): Violation[] => {
  const violations: Violation[] = [];
  if (!(menuRolePattern.test(fileContent) || menuItemRolePattern.test(fileContent))) {
    return violations;
  }

  if (arrowMenuKeyPattern.test(fileContent)) {
    return violations;
  }

  violations.push({
    filePath,
    line: 1,
    tagName: "menu",
    message: "ARIA menus must implement ArrowUp and ArrowDown keyboard navigation.",
  });

  return violations;
};

const collectPaginationViolations = (filePath: string, fileContent: string): Violation[] => {
  const violations: Violation[] = [];

  for (const match of fileContent.matchAll(pageButtonPattern)) {
    const buttonMarkup = match[0];
    if (ariaCurrentPattern.test(buttonMarkup)) {
      continue;
    }

    violations.push({
      filePath,
      line: getLineFromOffset(fileContent, match.index ?? 0),
      tagName: "button",
      message: 'Current-page pagination buttons must expose aria-current="page".',
    });
  }

  return violations;
};

const collectIconOnlyControlViolations = (filePath: string, fileContent: string): Violation[] => {
  const violations: Violation[] = [];

  for (const match of fileContent.matchAll(iconOnlyControlPattern)) {
    const [fullMatch, rawTagName, content] = match;
    if (!fullMatch) {
      continue;
    }

    if (hasAccessibleNameAttribute(fullMatch) || isAriaHiddenElement(fullMatch)) {
      continue;
    }

    const visibleText = stripMarkupToText(content ?? "");
    if (visibleText.length > 0) {
      continue;
    }

    violations.push({
      filePath,
      line: getLineFromOffset(fileContent, match.index ?? 0),
      tagName: rawTagName.toLowerCase(),
      message: "Icon-only controls must include aria-label or aria-labelledby.",
    });
  }

  return violations;
};

const collectFileViolations = async (filePath: string): Promise<Violation[]> => {
  const fileContent = await Bun.file(filePath).text();

  return [
    ...formControlTagNames.flatMap((tagName) =>
      collectFormControlViolations(filePath, fileContent, tagName),
    ),
    ...collectDialogViolations(filePath, fileContent),
    ...collectInteractiveRoleViolations(filePath, fileContent),
    ...collectFocusableViolations(filePath, fileContent),
    ...collectMenuTriggerViolations(filePath, fileContent),
    ...collectMenuKeyboardViolations(filePath, fileContent),
    ...collectDisclosureMenuViolations(filePath, fileContent),
    ...collectLabelControlViolations(filePath, fileContent),
    ...collectTabContractViolations(filePath, fileContent),
    ...collectPaginationViolations(filePath, fileContent),
    ...collectIconOnlyControlViolations(filePath, fileContent),
  ];
};

const collectViolations = async (): Promise<Violation[]> => {
  const files = await collectVueFiles();
  const perFileViolations = await Promise.all(
    files.map((filePath) => collectFileViolations(filePath)),
  );
  return perFileViolations.flat();
};

const main = async (): Promise<void> => {
  const violations = await collectViolations();

  if (violations.length === 0) {
    await writeOutput(
      "ARIA validation passed for dialogs, tab contracts, pagination semantics, disclosure widgets, and native interactive controls.",
    );
    return;
  }

  await writeError(
    "ARIA validation failed. Replace faux controls, label icon-only controls, and wire dialog/menu semantics correctly:",
  );
  const lines = violations.map(
    (violation) =>
      `- ${violation.filePath}:${violation.line} <${violation.tagName}> ${violation.message}`,
  );
  if (lines.length > 0) {
    await writeError(lines.join("\n"));
  }

  process.exit(1);
};

await main();
