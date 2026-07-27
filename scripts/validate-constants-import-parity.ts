import { join } from "node:path";
import {
  collectProjectFileEntries,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

/**
 * Named imports from `~/constants/*` must resolve to a real export.
 *
 * `constants/layout.ts` re-publishes its siblings by assignment (`export const X = chrome.X`)
 * rather than `export *`, so a constant added to a source module without its mirror line is
 * invisible until the browser evaluates the module. The ambient SFC module declaration types
 * every component as `DefineComponent<Record<string, unknown>, …>` for the native typechecker,
 * erasing prop and export types at the import boundary, so a Vue script
 * block importing a missing name typechecks clean and reaches production as a runtime 500 on
 * every route rendering that component.
 */
const CLIENT_ROOT = "packages/client";
const CONSTANTS_DIR = join(CLIENT_ROOT, "constants");

const NAMED_IMPORT_PATTERN =
  /import\s+(?:type\s+)?\{([^}]*)\}\s*from\s*["']~\/constants\/([A-Za-z0-9._-]+)["']/gu;
const EXPORTED_BINDING_PATTERN =
  /export\s+(?:declare\s+)?(?:const|let|var|function|class|type|interface|enum)\s+([A-Za-z0-9_$]+)/gu;
const EXPORT_LIST_PATTERN = /export\s+(?:type\s+)?\{([^}]*)\}/gu;
const STAR_REEXPORT_PATTERN = /export\s+\*\s+from/u;
const TYPE_PREFIX_PATTERN = /^\s*type\s+/u;
const ALIAS_SEPARATOR_PATTERN = /\s+as\s+/u;

/** `null` marks a module whose surface widens via `export *` and cannot be resolved textually. */
export type ModuleExportIndex = ReadonlyMap<string, ReadonlySet<string> | null>;

/** `foo`, `type Foo`, and `foo as bar` all name the binding `foo` in the source module. */
const readSpecifierName = (raw: string): string => {
  const [source] = raw.replace(TYPE_PREFIX_PATTERN, "").split(ALIAS_SEPARATOR_PATTERN);
  return (source ?? "").trim();
};

/** `export { a as b }` publishes `b`, so the alias is what consumers may import. */
const readExposedName = (raw: string): string => {
  if (!ALIAS_SEPARATOR_PATTERN.test(raw)) {
    return readSpecifierName(raw);
  }
  return (raw.split(ALIAS_SEPARATOR_PATTERN).at(-1) ?? "").trim();
};

/**
 * Collects every binding a module publishes, or `null` when it re-exports with a star.
 */
export const collectExportedNames = (source: string): Set<string> | null => {
  if (STAR_REEXPORT_PATTERN.test(source)) {
    return null;
  }
  const names = new Set<string>();
  for (const match of source.matchAll(EXPORTED_BINDING_PATTERN)) {
    const name = match[1];
    if (name !== undefined) {
      names.add(name);
    }
  }
  for (const match of source.matchAll(EXPORT_LIST_PATTERN)) {
    for (const entry of (match[1] ?? "").split(",")) {
      const exposed = readExposedName(entry);
      if (exposed.length > 0) {
        names.add(exposed);
      }
    }
  }
  return names;
};

/**
 * Flags names a file imports from `~/constants/*` that the target module never publishes.
 */
export const collectConstantsImportViolationsForContent = (
  filePath: string,
  content: string,
  exportsByModule: ModuleExportIndex,
): ValidationViolation[] => {
  const violations: ValidationViolation[] = [];
  for (const block of content.matchAll(NAMED_IMPORT_PATTERN)) {
    const moduleName = block[2];
    if (moduleName === undefined) {
      continue;
    }
    const exported = exportsByModule.get(moduleName);
    if (!exported) {
      continue;
    }
    const line = content.slice(0, block.index ?? 0).split("\n").length;
    for (const entry of (block[1] ?? "").split(",")) {
      const name = readSpecifierName(entry);
      if (name.length > 0 && !exported.has(name)) {
        violations.push({
          filePath,
          line,
          message: `\`${name}\` is imported from ~/constants/${moduleName} but that module never exports it.`,
        });
      }
    }
  }
  return violations;
};

const readModuleNames = (content: string): string[] =>
  [...content.matchAll(NAMED_IMPORT_PATTERN)].flatMap((block) =>
    block[2] === undefined ? [] : [block[2]],
  );

const indexModuleExports = async (moduleNames: readonly string[]): Promise<ModuleExportIndex> => {
  const entries = await Promise.all(
    moduleNames.map(async (moduleName): Promise<readonly [string, Set<string> | null]> => {
      const candidate = Bun.file(join(CONSTANTS_DIR, `${moduleName}.ts`));
      if (!(await candidate.exists())) {
        return [moduleName, null];
      }
      return [moduleName, collectExportedNames(await candidate.text())];
    }),
  );
  return new Map(entries);
};

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const files = await collectProjectFileEntries({
    scanRoots: [CLIENT_ROOT],
    allowedExtensions: new Set([".ts", ".vue"]),
  });

  const moduleNames = [...new Set(files.flatMap(({ content }) => readModuleNames(content)))];
  const exportsByModule = await indexModuleExports(moduleNames);

  return files.flatMap(({ filePath, content }) =>
    collectConstantsImportViolationsForContent(filePath, content, exportsByModule),
  );
};

if (import.meta.main) {
  await reportViolations(
    "Constants import parity validation failed:",
    await collectViolations(),
    "Constants import parity validation passed: every ~/constants import resolves to a real export.",
  );
}
