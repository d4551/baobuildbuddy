/**
 * Symbol-level reference counting for the dead-export gate.
 *
 * Split out of `validate-no-dead-exports.ts` to keep both modules under the
 * monolith ceiling. The counting rules live here; the violation reporting and
 * module-level resolution stay in the validator.
 */

const BLOCK_COMMENT_PATTERN = /\/\*[\s\S]*?\*\//gu;
/** `(?<!:)` keeps `https://…` inside template literals from reading as a comment. */
const LINE_COMMENT_PATTERN = /(?<![:\\])\/\/.*$/gmu;

/**
 * Comments routinely spell out `export { … } from` in prose, and scanning them
 * would mine documentation for export names.
 *
 * String bodies are deliberately left intact. Vue templates bind constants from
 * inside quoted attributes (`:class="SHELL_CLASS"`), and template literals hold
 * live references in `${…}`, so blanking quoted spans erases real usage and
 * reports live symbols as dead. Counting an occurrence inside a string is the
 * safe direction to err: it can only keep a symbol alive, never delete one.
 */
export const stripComments = (content: string): string =>
  content.replace(BLOCK_COMMENT_PATTERN, " ").replace(LINE_COMMENT_PATTERN, " ");

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
