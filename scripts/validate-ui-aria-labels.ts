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
const interactiveRoleNames = [
  "button",
  "menuitem",
  "menuitemradio",
  "menuitemcheckbox",
] as const;
const formControlTagNames = ["input", "select", "textarea"] as const;
const accessibleNameAttributePattern =
  /(?:\s|:|v-bind:)(?:aria-label|aria-labelledby|title)\s*=/u;
const dialogModalPattern = /(?:\s|:|v-bind:)aria-modal\s*=\s*["']true["']/u;
const hiddenInputPattern = /type\s*=\s*["']hidden["']/u;
const ariaHiddenElementPattern = /aria-hidden\s*=\s*["']true["']/u;
const ariaControlsPattern = /(?:\s|:|v-bind:)aria-controls\s*=/u;
const menuRolePattern = /role\s*=\s*["']menu["']/u;
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

const collectInteractiveRoleViolations = (
  filePath: string,
  fileContent: string,
): Violation[] => {
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
      message: 'Menu triggers must connect to their menu with aria-controls.',
    });
  }

  return violations;
};

const collectIconOnlyControlViolations = (
  filePath: string,
  fileContent: string,
): Violation[] => {
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
      "ARIA validation passed for dialogs, icon-only controls, menu triggers, and native interactive semantics.",
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
