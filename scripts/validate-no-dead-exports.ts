import {
  collectProjectFileEntries,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

const importPathPattern = /from\s+['"`]([^'"`]+)['"`]/gu;
const sideEffectImportPathPattern = /\bimport\s+['"`]([^'"`]+)['"`]/gu;
const dynamicImportPathPattern = /import\(\s*['"`]([^'"`]+)['"`]\s*\)/gu;
const namedExportPattern =
  /\bexport\s+(?:async\s+)?(?:class|function|const|let|var|type|interface)\s+([A-Za-z0-9_]+)/gu;
const reExportPattern = /\bexport\s*\{\s*([^}]+)\s*\}/gu;
const exportFromPathPattern =
  /\bexport\s+(?:\*\s*(?:as\s+[A-Za-z0-9_]+\s*)?|\{[^}]+\})\s*from\s*['"`]([^'"`]+)['"`]/gu;
const defaultExportPattern = /\bexport\s+default\b/gu;
const LEADING_SLASH_PATTERN = /^\/+/u;
const FILE_EXTENSION_PATTERN = /\.(ts|vue)$/u;
const NUXT_IMPORTS_MANIFEST_PATH = "packages/client/.nuxt/imports.d.ts";
const autoImportExportPattern = /\bexport\s*\{\s*([^}]+)\s*\}\s*from\s*['"`][^'"`]+['"`]/gu;
const AS_CLAUSE_PATTERN = /\s+as\s+/u;
const SOURCE_FILE_EXTENSIONS = [".ts", ".tsx", ".vue", ".js", ".mjs", ".cjs"] as const;

const stripSourceExtension = (pathValue: string): string => {
  for (const extension of SOURCE_FILE_EXTENSIONS) {
    if (pathValue.endsWith(extension)) {
      return pathValue.slice(0, -extension.length);
    }
  }
  return pathValue;
};

const collectSourceCandidates = (pathValue: string): string[] => {
  const basePath = stripSourceExtension(pathValue);
  const candidates = new Set<string>([pathValue, basePath]);

  for (const extension of SOURCE_FILE_EXTENSIONS) {
    candidates.add(`${basePath}${extension}`);
    candidates.add(`${basePath}/index${extension}`);
  }

  return [...candidates];
};

const LOCALE_ENTRY_FILE_PATTERN = /^packages\/client\/locales\/[^/]+\.ts$/u;
const LOCALE_CATALOG_FILE_PATTERN = /^packages\/client\/locales\/[^/]+\/catalog\.ts$/u;

const isLocaleCatalogEntrypoint = (filePath: string): boolean =>
  LOCALE_ENTRY_FILE_PATTERN.test(filePath) || LOCALE_CATALOG_FILE_PATTERN.test(filePath);

const isFrameworkEntrypointFile = (filePath: string): boolean =>
  filePath.endsWith(".test.ts") ||
  filePath.endsWith(".d.ts") ||
  filePath === "packages/client/app.vue" ||
  filePath === "packages/client/error.vue" ||
  filePath === "packages/client/nuxt.config.ts" ||
  filePath === "packages/client/vitest.config.ts" ||
  filePath.startsWith("packages/client/pages/") ||
  filePath.startsWith("packages/client/plugins/") ||
  filePath.startsWith("packages/client/layouts/") ||
  filePath.startsWith("packages/client/middleware/") ||
  isLocaleCatalogEntrypoint(filePath);

const normalizeImportTargets = (sourceFilePath: string, importPath: string): string[] => {
  if (importPath.startsWith("@bao/shared/")) {
    const relative = importPath.slice("@bao/shared/".length);
    return collectSourceCandidates(`packages/shared/src/${relative}`);
  }

  if (importPath.startsWith(".")) {
    const sourceDir = sourceFilePath.slice(0, sourceFilePath.lastIndexOf("/"));
    const joined = new URL(`${sourceDir}/${importPath}`, "file:///").pathname.replace(
      LEADING_SLASH_PATTERN,
      "",
    );
    return collectSourceCandidates(joined);
  }

  if (importPath.startsWith("~/")) {
    const relative = importPath.slice(2);
    return collectSourceCandidates(`packages/client/${relative}`);
  }

  return [];
};

const collectExportedRuntimeNames = (content: string): string[] => {
  const exportedNames = new Set<string>();
  const runtimeExportPattern =
    /\bexport\s+(?:async\s+)?(?:class|function|const|let|var)\s+([A-Za-z0-9_]+)/gu;
  runtimeExportPattern.lastIndex = 0;
  for (const match of content.matchAll(runtimeExportPattern)) {
    const exportedName = match[1];
    if (exportedName) {
      exportedNames.add(exportedName);
    }
  }

  reExportPattern.lastIndex = 0;
  for (const match of content.matchAll(reExportPattern)) {
    const clause = match[1] ?? "";
    for (const part of clause.split(",")) {
      const normalized = part.trim().split(AS_CLAUSE_PATTERN).at(-1)?.trim();
      if (normalized) {
        exportedNames.add(normalized);
      }
    }
  }

  return [...exportedNames];
};

const collectNuxtAutoImportNames = async (): Promise<Set<string>> => {
  const manifest = Bun.file(NUXT_IMPORTS_MANIFEST_PATH);
  if (!(await manifest.exists())) {
    return new Set();
  }

  const content = await manifest.text();
  const names = new Set<string>();

  autoImportExportPattern.lastIndex = 0;
  for (const match of content.matchAll(autoImportExportPattern)) {
    const clause = match[1] ?? "";
    for (const part of clause.split(",")) {
      const normalized = part.trim().split(AS_CLAUSE_PATTERN).at(-1)?.trim();
      if (normalized) {
        names.add(normalized);
      }
    }
  }

  return names;
};

const hasExports = (content: string): boolean => {
  namedExportPattern.lastIndex = 0;
  if (namedExportPattern.test(content)) {
    return true;
  }

  reExportPattern.lastIndex = 0;
  if (reExportPattern.test(content)) {
    return true;
  }

  exportFromPathPattern.lastIndex = 0;
  if (exportFromPathPattern.test(content)) {
    return true;
  }

  defaultExportPattern.lastIndex = 0;
  return defaultExportPattern.test(content);
};

const hasAutoImportConsumer = (
  filePath: string,
  exportName: string,
  sourceFiles: Array<{ filePath: string; content: string }>,
  autoImportNames: Set<string>,
): boolean => {
  const usagePattern = new RegExp(
    `\\b${exportName.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}\\b`,
    "u",
  );
  const isNuxtAutoImport = autoImportNames.has(exportName);
  return sourceFiles.some(({ filePath: sourceFilePath, content }) => {
    if (sourceFilePath === filePath) {
      return false;
    }
    if (!(isNuxtAutoImport || exportName.startsWith("use"))) {
      return false;
    }
    usagePattern.lastIndex = 0;
    return usagePattern.test(content);
  });
};

export const collectImportedTargets = (
  importSources: Array<{ filePath: string; content: string }>,
): Set<string> => {
  const importedTargets = new Set<string>();
  const importPatterns = [
    importPathPattern,
    sideEffectImportPathPattern,
    dynamicImportPathPattern,
    exportFromPathPattern,
  ];

  const collectPatternTargets = (filePath: string, content: string, pattern: RegExp): string[] => {
    pattern.lastIndex = 0;
    const targets: string[] = [];
    for (const match of content.matchAll(pattern)) {
      const importPath = match[1] ?? "";
      targets.push(...normalizeImportTargets(filePath, importPath));
    }
    return targets;
  };

  for (const { filePath, content } of importSources) {
    for (const importPattern of importPatterns) {
      for (const normalizedTarget of collectPatternTargets(filePath, content, importPattern)) {
        importedTargets.add(normalizedTarget);
      }
    }
  }

  return importedTargets;
};

export const isDeadExportViolation = (options: {
  filePath: string;
  content: string;
  importSources: Array<{ filePath: string; content: string }>;
  autoImportNames: Set<string>;
  importedTargets: Set<string>;
}): ValidationViolation[] => {
  const { filePath, content, importSources, autoImportNames, importedTargets } = options;
  if (isFrameworkEntrypointFile(filePath) || !hasExports(content)) {
    return [];
  }

  const exportedNames = collectExportedRuntimeNames(content);
  if (
    filePath.startsWith("packages/client/composables/") &&
    exportedNames.some((exportName) => exportName.startsWith("use")) &&
    exportedNames.every((exportName) =>
      hasAutoImportConsumer(filePath, exportName, importSources, autoImportNames),
    )
  ) {
    return [];
  }

  const candidatePaths = [filePath, filePath.replace(FILE_EXTENSION_PATTERN, "/index.ts")];
  const isImported = candidatePaths.some((candidatePath) => importedTargets.has(candidatePath));
  return isImported
    ? []
    : [
        {
          filePath,
          line: 1,
          message:
            "Exported module has no internal consumers. Remove the dead export or wire it into a real caller.",
        },
      ];
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
  const importSources = await collectProjectFileEntries({
    scanRoots: [
      "packages/client",
      "packages/server/src",
      "packages/shared/src",
      "packages/scraper/src",
      "scripts",
    ],
    allowedExtensions: new Set([".ts", ".vue"]),
  });
  const autoImportNames = await collectNuxtAutoImportNames();
  const importedTargets = collectImportedTargets(importSources);

  return files.flatMap(({ filePath, content }) =>
    isDeadExportViolation({
      filePath,
      content,
      importSources,
      autoImportNames,
      importedTargets,
    }),
  );
};

if (import.meta.main) {
  await reportViolations(
    "Dead export validation failed:",
    await collectViolations(),
    "Dead export validation passed.",
  );
}
