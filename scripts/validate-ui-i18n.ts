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
const templateInterpolationPattern = /\{\{[\s\S]*?\}\}/gu;
const whitespacePattern = /\s+/gu;
const localeKeyFormatPattern = /^[a-zA-Z0-9_.-]+$/u;
const punctuationOnlyPattern = /^[\d\s+./,:;!?()[\]{}<>=_%|*&'"`~-]+$/u;
const humanTextPattern = /\p{L}/u;

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

const collectLocalePaths = (value: unknown): Set<string> => {
  const keys = new Set<string>();

  const visit = (pathValue: string, node: unknown): void => {
    if (pathValue.length > 0) {
      keys.add(pathValue);
    }

    if (typeof node === "string") {
      return;
    }

    if (Array.isArray(node)) {
      for (let index = 0; index < node.length; index += 1) {
        const childPath = pathValue.length > 0 ? `${pathValue}.${index}` : `${index}`;
        visit(childPath, node[index]);
      }
      return;
    }

    if (isRecord(node)) {
      for (const [key, childNode] of Object.entries(node)) {
        const childPath = pathValue.length > 0 ? `${pathValue}.${key}` : key;
        visit(childPath, childNode);
      }
    }
  };

  visit("", value);
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

const collectTemplateTags = (templateContent: string): TemplateTag[] => {
  const tags: TemplateTag[] = [];
  const contentLength = templateContent.length;
  let index = 0;

  while (index < contentLength) {
    const openOffset = templateContent.indexOf("<", index);
    if (openOffset === -1) {
      break;
    }

    let cursor = openOffset + 1;
    let quote: "'" | '"' | null = null;
    while (cursor < contentLength) {
      const char = templateContent[cursor];
      if (quote) {
        if (char === quote) {
          quote = null;
        }
      } else if (char === "'" || char === '"') {
        quote = char;
      } else if (char === ">") {
        break;
      }
      cursor += 1;
    }

    if (cursor >= contentLength) {
      break;
    }

    const markup = templateContent.slice(openOffset, cursor + 1);
    if (!markup.startsWith("</") && !markup.startsWith("<!")) {
      tags.push({
        markup,
        offset: openOffset,
      });
    }

    index = cursor + 1;
  }

  return tags;
};

const collectTemplateTextSegments = (
  templateContent: string,
): TemplateTextSegment[] => {
  const segments: TemplateTextSegment[] = [];
  const contentLength = templateContent.length;
  let inTag = false;
  let inInterpolation = false;
  let quote: "'" | '"' | null = null;
  let textStart = 0;
  let index = 0;

  while (index < contentLength) {
    const char = templateContent[index];
    const nextChar = index + 1 < contentLength ? templateContent[index + 1] : "";
    if (!inTag) {
      if (inInterpolation) {
        if (char === "}" && nextChar === "}") {
          inInterpolation = false;
          index += 2;
          continue;
        }
        index += 1;
        continue;
      }

      if (char === "{" && nextChar === "{") {
        inInterpolation = true;
        index += 2;
        continue;
      }

      if (char === "<") {
        if (index > textStart) {
          segments.push({
            text: templateContent.slice(textStart, index),
            offset: textStart,
          });
        }
        inTag = true;
      }
      index += 1;
      continue;
    }

    if (quote) {
      if (char === quote) {
        quote = null;
      }
      index += 1;
      continue;
    }

    if (char === "'" || char === '"') {
      quote = char;
      index += 1;
      continue;
    }

    if (char === ">") {
      inTag = false;
      textStart = index + 1;
    }

    index += 1;
  }

  if (!inTag && textStart < contentLength) {
    segments.push({
      text: templateContent.slice(textStart),
      offset: textStart,
    });
  }

  return segments;
};

const hasHumanText = (value: string): boolean => humanTextPattern.test(value);

const normalizeTemplateText = (value: string): string =>
  value
    .replace(templateInterpolationPattern, " ")
    .replace(whitespacePattern, " ")
    .trim();

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

const collectStaticTemplateViolations = (
  filePath: string,
  fileContent: string,
): Violation[] => {
  const blocks = extractTemplateBlocks(fileContent);
  const violations: Violation[] = [];

  for (const block of blocks) {
    const tags = collectTemplateTags(block.content);
    for (const tag of tags) {
      for (const match of tag.markup.matchAll(staticAttributePattern)) {
        const attributeName = match[1] ?? "";
        const value = (match[3] ?? match[4] ?? "").trim();
        if (value.length === 0 || !hasHumanText(value)) {
          continue;
        }

        violations.push({
          filePath,
          line: getLineFromOffset(
            fileContent,
            block.offset + tag.offset + (match.index ?? 0),
          ),
          message: `Static template attribute "${attributeName}" contains user-visible text. Use i18n binding (for example :${attributeName}="t('...')").`,
        });
      }
    }

    const textSegments = collectTemplateTextSegments(block.content);
    for (const segment of textSegments) {
      const normalizedText = normalizeTemplateText(segment.text);
      if (isIgnoredTemplateText(normalizedText) || !hasHumanText(normalizedText)) {
        continue;
      }

      violations.push({
        filePath,
        line: getLineFromOffset(fileContent, block.offset + segment.offset),
        message:
          `Static template text "${normalizedText}" detected. Use translation keys with t('...') for user-visible copy.`,
      });
    }
  }

  return violations;
};

const collectViolations = async (): Promise<Violation[]> => {
  const localeKeys = collectLocalePaths(enUS);
  const files = await collectClientSourceFiles();
  const violations: Violation[] = [];

  for (const filePath of files) {
    const fileContent = await Bun.file(filePath).text();
    violations.push(
      ...collectMissingTranslationKeyViolations(filePath, fileContent, localeKeys),
    );

    if (filePath.endsWith(".vue")) {
      violations.push(...collectStaticTemplateViolations(filePath, fileContent));
    }
  }

  return violations;
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
  for (const violation of violations) {
    await writeError(`- ${violation.filePath}:${violation.line} ${violation.message}`);
  }
  process.exit(1);
};

await main();
