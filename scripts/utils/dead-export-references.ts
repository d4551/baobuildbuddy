/**
 * Symbol-level reference counting for the dead-export gate.
 *
 * Split out of `validate-no-dead-exports.ts` to keep both modules under the
 * monolith ceiling. The counting rules live here; the violation reporting and
 * module-level resolution stay in the validator.
 */

/**
 * Removes comments while leaving string and template-literal bodies intact.
 *
 * Comments routinely spell out `export { … } from` in prose, and scanning them would
 * mine documentation for export names. String bodies must survive, though: Vue
 * templates bind constants from inside quoted attributes (`:class="SHELL_CLASS"`) and
 * template literals hold live references in `${…}`, so blanking quoted spans erases
 * real usage and reports live symbols as dead.
 *
 * That combination rules out regex replacement. A pattern cannot tell a comment
 * opener from the same characters inside a string, and this repo has one:
 * `` `${API_ENDPOINT_PREFIX}/**` `` in `packages/client/nuxt.config.ts`. A
 * non-greedy block-comment regex treated it as an opener and ran to the next real
 * close delimiter far below, deleting ~7KB of code — every use site in between — and
 * reporting nine live constants as dead exports.
 *
 * So walk the source once, tracking whether we are inside a quote, a template
 * literal, a line comment or a block comment, and drop only real comment spans.
 * (A `/*` inside a regex literal is still treated as a comment opener; regex
 * literals cannot be told from division without a full parser, and no such literal
 * exists here.)
 */
const QUOTE_CHARACTERS = new Set(['"', "'", "`"]);

/** Copies a quoted span verbatim; returns the index just past its closing quote. */
const copyQuotedSpan = (content: string, start: number, output: string[]): number => {
  const quote = content[start] ?? "";
  output.push(quote);
  let index = start + 1;

  while (index < content.length) {
    const character = content[index] ?? "";
    output.push(character);
    if (character === "\\") {
      output.push(content[index + 1] ?? "");
      index += 2;
      continue;
    }
    index += 1;
    if (character === quote) {
      return index;
    }
  }
  return index;
};

/** Returns the index just past the comment that starts at `start`, or the content end. */
const skipComment = (content: string, start: number): number => {
  if (content[start + 1] === "/") {
    const lineEnd = content.indexOf("\n", start);
    return lineEnd === -1 ? content.length : lineEnd;
  }
  const blockEnd = content.indexOf("*/", start + 2);
  return blockEnd === -1 ? content.length : blockEnd + 2;
};

const startsComment = (content: string, index: number): boolean =>
  content[index] === "/" && (content[index + 1] === "/" || content[index + 1] === "*");

export const stripComments = (content: string): string => {
  const output: string[] = [];
  let index = 0;

  while (index < content.length) {
    const character = content[index] ?? "";
    if (QUOTE_CHARACTERS.has(character)) {
      index = copyQuotedSpan(content, index, output);
      continue;
    }
    if (startsComment(content, index)) {
      output.push(" ");
      index = skipComment(content, index);
      continue;
    }
    output.push(character);
    index += 1;
  }

  return output.join("");
};

const IMPORT_STATEMENT_PATTERN = /\bimport\b[^;'"]*?\bfrom\b\s*['"`][^'"`]*['"`]/gu;
const EXPORT_FROM_STATEMENT_PATTERN = /\bexport\b[^;'"]*?\bfrom\b\s*['"`][^'"`]*['"`]/gu;
const IDENTIFIER_PATTERN = /[A-Za-z_$][\w$]*/gu;
/** `originalName as localAlias` inside an import or export-from clause. */
const RENAMED_BINDING_PATTERN = /\b([A-Za-z_$][\w$]*)\s+as\s+([A-Za-z_$][\w$]*)/gu;

/**
 * Module-specifier statements are stripped before reference counting so that an
 * import which names a symbol but never uses it cannot keep that export alive.
 */
export const stripModuleSpecifierStatements = (content: string): string =>
  stripComments(content)
    .replace(IMPORT_STATEMENT_PATTERN, " ")
    .replace(EXPORT_FROM_STATEMENT_PATTERN, " ");

/**
 * Names consumed through a rename (`import { a as b }`) never appear in the
 * body under their original spelling, so the stripped text alone would report
 * them dead. Each rename whose local alias is actually used counts as one
 * reference to the original name; an unused aliased import stays dead and is
 * separately caught by the unused-import lint.
 */
const collectRenamedBindingUses = (content: string): string[] => {
  const withoutComments = stripComments(content);
  const body = stripModuleSpecifierStatements(content);
  const statements = [
    ...(withoutComments.match(IMPORT_STATEMENT_PATTERN) ?? []),
    ...(withoutComments.match(EXPORT_FROM_STATEMENT_PATTERN) ?? []),
  ];

  const uses: string[] = [];
  for (const statement of statements) {
    RENAMED_BINDING_PATTERN.lastIndex = 0;
    for (const match of statement.matchAll(RENAMED_BINDING_PATTERN)) {
      const [, originalName, localAlias] = match;
      if (originalName === undefined || localAlias === undefined) {
        continue;
      }
      if (new RegExp(`\\b${localAlias}\\b`, "u").test(body)) {
        uses.push(originalName);
      }
    }
  }
  return uses;
};

/**
 * Count how often every identifier appears across all sources with import and
 * export-from clauses stripped. A declaration contributes exactly one
 * occurrence, so a symbol whose total count is 1 is referenced by nothing —
 * not by another module, not by a test, not even by its own file. An unused
 * import can no longer keep such a symbol alive, because the clause naming it
 * is removed before counting.
 */
export const collectIdentifierOccurrences = (
  sources: Array<{ filePath: string; content: string }>,
): Map<string, number> => {
  const occurrences = new Map<string, number>();
  for (const { content } of sources) {
    const body = stripModuleSpecifierStatements(content);
    IDENTIFIER_PATTERN.lastIndex = 0;
    for (const match of body.matchAll(IDENTIFIER_PATTERN)) {
      const identifier = match[0];
      occurrences.set(identifier, (occurrences.get(identifier) ?? 0) + 1);
    }
    for (const renamed of collectRenamedBindingUses(content)) {
      occurrences.set(renamed, (occurrences.get(renamed) ?? 0) + 1);
    }
  }
  return occurrences;
};
