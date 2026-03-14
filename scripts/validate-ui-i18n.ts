import enUS from "../packages/client/locales/en-US";
import { writeError, writeOutput } from "./utils/cli-output";

type Violation = {
  filePath: string;
  line: number;
  message: string;
};

type TemplateBlock = {
  content: string;
  offset: number;
};

type TemplateTag = {
  markup: string;
  offset: number;
};

type TemplateTextSegment = {
  text: string;
  offset: number;
};

type LocalePathFrame = {
  pathValue: string;
  node: unknown;
};

type TemplateTextScanState = {
  inTag: boolean;
  inInterpolation: boolean;
  quote: "'" | '"' | null;
  textStart: number;
  index: number;
};

type TemplateCharacterWindow = {
  char: string;
  nextChar: string;
};

const projectRoot = process.cwd();
const clientRoot = "packages/client";
const sourceExtensions = new Set([".vue", ".ts", ".tsx", ".js", ".mjs", ".cjs"]);
const ignoredDirectoryNames = new Set([
  "node_modules",
  ".git",
  ".nuxt",
  ".output",
  "dist",
  "dist-types",
  "coverage",
]);

const translationCallPattern = /(?:\b\$?t)\(\s*(['"`])([^'"`]+)\1/gu;
const staticAttributePattern =
  /(?<![:\w-])(aria-label|aria-description|aria-placeholder|placeholder|title|alt|data-tip)\s*=\s*("([^"]*)"|'([^']*)')/gu;
const boundAttributeLiteralPattern =
  /(?:\s|<)(?::|v-bind:)(aria-label|aria-description|aria-placeholder|placeholder|title|alt|data-tip)\s*=\s*("([^"]*)"|'([^']*)')/gu;
const templateInterpolationPattern = /\{\{[\s\S]*?\}\}/gu;
const whitespacePattern = /\s+/gu;
const localeKeyFormatPattern = /^[a-zA-Z0-9_.-]+$/u;
const punctuationOnlyPattern = /^[\d\s+./,:;!?()[\]{}<>=_%|*&'"`~-]+$/u;
const humanTextPattern = /\p{L}/u;
const templateOpenToken = "{{";
const templateCloseToken = "}}";
const tagOpenToken = "<";
const tagCloseToken = ">";
const closingTagPrefix = "</";
const declarationTagPrefix = "<!";

const shouldIgnorePath = (pathValue: string): boolean =>
  pathValue.split("/").some((segment) => ignoredDirectoryNames.has(segment));

const hasSourceExtension = (pathValue: string): boolean => {
  for (const extension of sourceExtensions) {
    if (pathValue.endsWith(extension)) {
      return true;
    }
  }
  return false;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const createChildPath = (pathValue: string, child: string | number): string =>
  pathValue.length > 0 ? `${pathValue}.${child}` : `${child}`;

const collectChildLocaleFrames = (frame: LocalePathFrame, stack: LocalePathFrame[]): void => {
  if (Array.isArray(frame.node)) {
    for (let index = frame.node.length - 1; index >= 0; index -= 1) {
      stack.push({
        pathValue: createChildPath(frame.pathValue, index),
        node: frame.node[index],
      });
    }
    return;
  }

  if (!isRecord(frame.node)) {
    return;
  }

  const entries = Object.entries(frame.node);
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const [key, childNode] = entries[index];
    stack.push({
      pathValue: createChildPath(frame.pathValue, key),
      node: childNode,
    });
  }
};

const collectLocalePaths = (value: unknown): Set<string> => {
  const keys = new Set<string>();
  const stack: LocalePathFrame[] = [{ pathValue: "", node: value }];

  while (stack.length > 0) {
    const frame = stack.pop();
    if (!frame) {
      continue;
    }

    if (frame.pathValue.length > 0) {
      keys.add(frame.pathValue);
    }

    if (typeof frame.node !== "string") {
      collectChildLocaleFrames(frame, stack);
    }
  }
  return keys;
};

const getLineFromOffset = (text: string, offset: number): number => {
  if (offset <= 0) {
    return 1;
  }

  let line = 1;
  for (let index = 0; index < offset; index += 1) {
    if (text.charCodeAt(index) === 10) {
      line += 1;
    }
  }
  return line;
};

const collectClientSourceFiles = async (): Promise<string[]> => {
  const files: string[] = [];
  const glob = new Bun.Glob(`${clientRoot}/**/*`);

  for await (const relativeFilePath of glob.scan({ cwd: projectRoot, onlyFiles: true })) {
    const normalizedPath = relativeFilePath.replace(/\\/gu, "/");
    if (shouldIgnorePath(normalizedPath) || !hasSourceExtension(normalizedPath)) {
      continue;
    }
    files.push(normalizedPath);
  }

  return files;
};

const extractTemplateBlocks = (fileContent: string): TemplateBlock[] => {
  const blocks: TemplateBlock[] = [];
  const openTagPattern = /<template\b[^>]*>/giu;
  let openMatch = openTagPattern.exec(fileContent);

  while (openMatch) {
    const openTag = openMatch[0];
    const startOffset = (openMatch.index ?? 0) + openTag.length;
    const closeOffset = fileContent.indexOf("</template>", startOffset);
    if (closeOffset === -1) {
      break;
    }
    blocks.push({
      content: fileContent.slice(startOffset, closeOffset),
      offset: startOffset,
    });
    openTagPattern.lastIndex = closeOffset + "</template>".length;
    openMatch = openTagPattern.exec(fileContent);
  }

  return blocks;
};

const isQuoteCharacter = (char: string): char is "'" | '"' => char === "'" || char === '"';

const isTemplateTagCandidate = (markup: string): boolean =>
  !(markup.startsWith(closingTagPrefix) || markup.startsWith(declarationTagPrefix));

const findTagCloseOffset = (templateContent: string, openOffset: number): number => {
  const contentLength = templateContent.length;
  let cursor = openOffset + 1;
  let quote: "'" | '"' | null = null;

  while (cursor < contentLength) {
    const char = templateContent[cursor];
    if (quote) {
      if (char === quote) {
        quote = null;
      }
      cursor += 1;
      continue;
    }

    if (isQuoteCharacter(char)) {
      quote = char;
      cursor += 1;
      continue;
    }

    if (char === tagCloseToken) {
      return cursor;
    }

    cursor += 1;
  }

  return -1;
};

const collectTemplateTags = (templateContent: string): TemplateTag[] => {
  const tags: TemplateTag[] = [];
  const contentLength = templateContent.length;
  let index = 0;

  while (index < contentLength) {
    const openOffset = templateContent.indexOf(tagOpenToken, index);
    if (openOffset === -1) {
      break;
    }

    const closeOffset = findTagCloseOffset(templateContent, openOffset);
    if (closeOffset === -1) {
      break;
    }

    const markup = templateContent.slice(openOffset, closeOffset + 1);
    if (isTemplateTagCandidate(markup)) {
      tags.push({
        markup,
        offset: openOffset,
      });
    }

    index = closeOffset + 1;
  }

  return tags;
};

const appendTextSegment = (
  segments: TemplateTextSegment[],
  templateContent: string,
  textStart: number,
  textEnd: number,
): void => {
  if (textEnd <= textStart) {
    return;
  }

  segments.push({
    text: templateContent.slice(textStart, textEnd),
    offset: textStart,
  });
};

const isTokenPair = (char: string, nextChar: string, token: string): boolean =>
  char === token[0] && nextChar === token[1];

const advanceTagState = (state: TemplateTextScanState, char: string): void => {
  if (state.quote) {
    if (char === state.quote) {
      state.quote = null;
    }
    return;
  }

  if (isQuoteCharacter(char)) {
    state.quote = char;
    return;
  }

  if (char === tagCloseToken) {
    state.inTag = false;
    state.textStart = state.index + 1;
  }
};

const advanceTextState = (
  state: TemplateTextScanState,
  segments: TemplateTextSegment[],
  templateContent: string,
  charWindow: TemplateCharacterWindow,
): number => {
  const { char, nextChar } = charWindow;
  if (state.inInterpolation) {
    if (isTokenPair(char, nextChar, templateCloseToken)) {
      state.inInterpolation = false;
      return 2;
    }
    return 1;
  }

  if (isTokenPair(char, nextChar, templateOpenToken)) {
    state.inInterpolation = true;
    return 2;
  }

  if (char === tagOpenToken) {
    appendTextSegment(segments, templateContent, state.textStart, state.index);
    state.inTag = true;
  }

  return 1;
};

const collectTemplateTextSegments = (templateContent: string): TemplateTextSegment[] => {
  const segments: TemplateTextSegment[] = [];
  const state: TemplateTextScanState = {
    inTag: false,
    inInterpolation: false,
    quote: null,
    textStart: 0,
    index: 0,
  };

  while (state.index < templateContent.length) {
    const char = templateContent[state.index];
    const nextChar =
      state.index + 1 < templateContent.length ? templateContent[state.index + 1] : "";

    if (state.inTag) {
      advanceTagState(state, char);
      state.index += 1;
      continue;
    }

    const offsetDelta = advanceTextState(state, segments, templateContent, { char, nextChar });
    state.index += offsetDelta;
  }

  if (!state.inTag) {
    appendTextSegment(segments, templateContent, state.textStart, templateContent.length);
  }

  return segments;
};

const hasHumanText = (value: string): boolean => humanTextPattern.test(value);

const normalizeTemplateText = (value: string): string =>
  value.replace(templateInterpolationPattern, " ").replace(whitespacePattern, " ").trim();

const isIgnoredTemplateText = (value: string): boolean => {
  if (value.length === 0) {
    return true;
  }
  if (punctuationOnlyPattern.test(value)) {
    return true;
  }
  if (value === "&nbsp;") {
    return true;
  }
  return false;
};

const collectMissingTranslationKeyViolations = (
  filePath: string,
  fileContent: string,
  localeKeys: Set<string>,
): Violation[] => {
  const violations: Violation[] = [];

  for (const match of fileContent.matchAll(translationCallPattern)) {
    const key = match[2]?.trim() ?? "";
    if (!localeKeyFormatPattern.test(key)) {
      continue;
    }
    if (localeKeys.has(key)) {
      continue;
    }

    violations.push({
      filePath,
      line: getLineFromOffset(fileContent, match.index ?? 0),
      message: `Missing translation key in en-US locale: "${key}"`,
    });
  }

  return violations;
};

const isQuotedLiteralExpression = (expression: string): boolean => {
  const opensWithSingleQuote = expression.startsWith("'");
  const closesWithSingleQuote = expression.endsWith("'");
  const opensWithDoubleQuote = expression.startsWith('"');
  const closesWithDoubleQuote = expression.endsWith('"');
  const opensWithBacktick = expression.startsWith("`");
  const closesWithBacktick = expression.endsWith("`");

  return (
    (opensWithSingleQuote && closesWithSingleQuote) ||
    (opensWithDoubleQuote && closesWithDoubleQuote) ||
    (opensWithBacktick && closesWithBacktick && !expression.includes("${"))
  );
};

const collectStaticAttributeViolations = (
  filePath: string,
  fileContent: string,
  block: TemplateBlock,
  tag: TemplateTag,
): Violation[] => {
  const violations: Violation[] = [];
  for (const match of tag.markup.matchAll(staticAttributePattern)) {
    const attributeName = match[1] ?? "";
    const value = (match[3] ?? match[4] ?? "").trim();
    if (value.length === 0 || !hasHumanText(value)) {
      continue;
    }

    violations.push({
      filePath,
      line: getLineFromOffset(fileContent, block.offset + tag.offset + (match.index ?? 0)),
      message: `Static template attribute "${attributeName}" contains user-visible text. Use i18n binding (for example :${attributeName}="t('...')").`,
    });
  }
  return violations;
};

const collectBoundLiteralAttributeViolations = (
  filePath: string,
  fileContent: string,
  block: TemplateBlock,
  tag: TemplateTag,
): Violation[] => {
  const violations: Violation[] = [];
  for (const match of tag.markup.matchAll(boundAttributeLiteralPattern)) {
    const attributeName = match[1] ?? "";
    const expression = (match[3] ?? match[4] ?? "").trim();
    if (expression.length < 2 || !isQuotedLiteralExpression(expression)) {
      continue;
    }

    const literalValue = expression.slice(1, -1).trim();
    if (literalValue.length === 0 || !hasHumanText(literalValue)) {
      continue;
    }

    violations.push({
      filePath,
      line: getLineFromOffset(fileContent, block.offset + tag.offset + (match.index ?? 0)),
      message:
        `Bound template attribute "${attributeName}" uses a literal string expression. ` +
        `Use i18n binding (for example :${attributeName}="t('...')").`,
    });
  }
  return violations;
};

const collectAttributeViolations = (
  filePath: string,
  fileContent: string,
  block: TemplateBlock,
  tag: TemplateTag,
): Violation[] => [
  ...collectStaticAttributeViolations(filePath, fileContent, block, tag),
  ...collectBoundLiteralAttributeViolations(filePath, fileContent, block, tag),
];

const collectTextViolations = (
  filePath: string,
  fileContent: string,
  block: TemplateBlock,
): Violation[] => {
  const violations: Violation[] = [];
  for (const segment of collectTemplateTextSegments(block.content)) {
    const normalizedText = normalizeTemplateText(segment.text);
    if (isIgnoredTemplateText(normalizedText) || !hasHumanText(normalizedText)) {
      continue;
    }

    violations.push({
      filePath,
      line: getLineFromOffset(fileContent, block.offset + segment.offset),
      message: `Static template text "${normalizedText}" detected. Use translation keys with t('...') for user-visible copy.`,
    });
  }
  return violations;
};

const collectStaticTemplateViolations = (filePath: string, fileContent: string): Violation[] =>
  extractTemplateBlocks(fileContent).flatMap((block) => {
    const attributeViolations = collectTemplateTags(block.content).flatMap((tag) =>
      collectAttributeViolations(filePath, fileContent, block, tag),
    );
    const textViolations = collectTextViolations(filePath, fileContent, block);
    return [...attributeViolations, ...textViolations];
  });

const collectViolations = async (): Promise<Violation[]> => {
  const localeKeys = collectLocalePaths(enUS);
  const files = await collectClientSourceFiles();
  const violationGroups = await Promise.all(
    files.map(async (filePath) => {
      const fileContent = await Bun.file(filePath).text();
      const fileViolations = collectMissingTranslationKeyViolations(
        filePath,
        fileContent,
        localeKeys,
      );
      if (filePath.endsWith(".vue")) {
        fileViolations.push(...collectStaticTemplateViolations(filePath, fileContent));
      }
      return fileViolations;
    }),
  );

  return violationGroups.flat();
};

const main = async (): Promise<void> => {
  const violations = await collectViolations();

  if (violations.length === 0) {
    await writeOutput(
      "UI i18n validation passed: no missing translation keys or static UI text/attributes detected.",
    );
    return;
  }

  await writeError(
    "UI i18n validation failed. Replace static user-visible copy with i18n keys and ensure all keys exist in en-US locale:",
  );
  const lines = violations.map(
    (violation) => `- ${violation.filePath}:${violation.line} ${violation.message}`,
  );
  if (lines.length > 0) {
    await writeError(lines.join("\n"));
  }
  process.exit(1);
};

await main();
