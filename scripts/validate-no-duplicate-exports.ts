import {
  collectProjectFileEntries,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

/**
 * Dual-source guard: every exported symbol must have exactly one defining
 * module. Alias projections (`export const X = ns.X`, `export type X = ns.X`)
 * are single-source facades — the noBarrelFile discipline bans `export … from`,
 * so facades assign through a namespace import instead; those are exempt.
 * Module-level dead-export checks cannot see a duplicate hiding inside a
 * living module, so this gate works at symbol granularity.
 */
const exportDefinitionPattern =
  /^[\t ]*export\s+(?:async\s+)?(?:const|function|class|type|interface|enum)\s+([A-Za-z0-9_]+)/gmu;
const constAliasPattern =
  /^[\t ]*export\s+const\s+([A-Za-z0-9_]+)\s*(?::[^=;]+)?=\s*[A-Za-z_$][A-Za-z0-9_$]*(?:\.[A-Za-z_$][A-Za-z0-9_$]*)*\s*;?/gmu;
const typeAliasPattern =
  /^[\t ]*export\s+type\s+([A-Za-z0-9_]+)\s*=\s*[A-Za-z_$][A-Za-z0-9_$]*(?:\.[A-Za-z_$][A-Za-z0-9_$]*)*\s*;?/gmu;
const DECLARATION_FILE_PATTERN = /\.d\.ts$/u;
const TEST_FILE_PATTERN = /\.test\.ts$/u;

export type ExportDefinition = {
  name: string;
  filePath: string;
  line: number;
};

const lineNumberAt = (content: string, index: number): number => {
  let line = 1;
  for (let position = 0; position < index; position += 1) {
    if (content.charCodeAt(position) === 10) {
      line += 1;
    }
  }
  return line;
};

const collectAliasNames = (content: string): Set<string> => {
  const aliasNames = new Set<string>();
  const aliasPatterns = [constAliasPattern, typeAliasPattern];
  for (const aliasPattern of aliasPatterns) {
    for (const match of content.matchAll(aliasPattern)) {
      const name = match[1];
      if (name) {
        aliasNames.add(name);
      }
    }
  }
  return aliasNames;
};

export const collectExportDefinitions = (
  files: Array<{ filePath: string; content: string }>,
): ExportDefinition[] => {
  const definitions: ExportDefinition[] = [];
  for (const { filePath, content } of files) {
    if (DECLARATION_FILE_PATTERN.test(filePath) || TEST_FILE_PATTERN.test(filePath)) {
      continue;
    }
    const aliasNames = collectAliasNames(content);
    exportDefinitionPattern.lastIndex = 0;
    for (const match of content.matchAll(exportDefinitionPattern)) {
      const name = match[1];
      if (!name || aliasNames.has(name)) {
        continue;
      }
      definitions.push({ name, filePath, line: lineNumberAt(content, match.index ?? 0) });
    }
  }
  return definitions;
};

export const collectDuplicateExportViolations = (
  definitions: ExportDefinition[],
): ValidationViolation[] => {
  const definitionsByName = new Map<string, ExportDefinition[]>();
  for (const definition of definitions) {
    const entries = definitionsByName.get(definition.name) ?? [];
    entries.push(definition);
    definitionsByName.set(definition.name, entries);
  }

  const violations: ValidationViolation[] = [];
  for (const [name, entries] of definitionsByName) {
    const definingFiles = [...new Set(entries.map((entry) => entry.filePath))].sort();
    if (definingFiles.length < 2) {
      continue;
    }
    const [canonicalFile, ...duplicateFiles] = definingFiles;
    for (const duplicateFile of duplicateFiles) {
      const firstEntry = entries.find((entry) => entry.filePath === duplicateFile);
      violations.push({
        filePath: duplicateFile,
        line: firstEntry?.line ?? 1,
        message: `Export "${name}" is defined in multiple modules (${canonicalFile}, ${duplicateFile}). Keep one canonical definition; alias through a namespace import instead of duplicating.`,
      });
    }
  }
  return violations;
};

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const files = await collectProjectFileEntries({
    scanRoots: [
      "packages/client",
      "packages/server/src",
      "packages/shared/src",
      "packages/scraper/src",
      "scripts",
    ],
    allowedExtensions: new Set([".ts", ".vue"]),
  });
  return collectDuplicateExportViolations(collectExportDefinitions(files));
};

if (import.meta.main) {
  await reportViolations(
    "Duplicate export validation failed:",
    await collectViolations(),
    "Duplicate export validation passed.",
  );
}
