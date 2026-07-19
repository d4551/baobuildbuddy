import {
  collectProjectFileEntries,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

const COMPONENT_SCAN_ROOT = "packages/client/components";
const FRAMEWORK_ENTRY_ROOTS = ["packages/client/pages/", "packages/client/layouts/"];
const FRAMEWORK_ENTRY_FILES = new Set([
  "packages/client/app.vue",
  "packages/client/error.vue",
  "packages/client/nuxt.config.ts",
]);
const ICON_REGISTRY_PATH = "packages/client/components/icons/icon-registry.ts";
const KEBAB_CASE_MID_PATTERN = /([a-z0-9])([A-Z])/gu;
const KEBAB_CASE_ACRONYM_PATTERN = /([A-Z])([A-Z][a-z])/gu;
const LINE_BREAK_PATTERN = /\r?\n/u;
const VUE_EXTENSION_PATTERN = /\.vue$/u;
const ICON_REGISTRY_ENTRY_PATTERN = /^\s*([A-Z][A-Za-z0-9]+),\s*$/gmu;
const REGEX_ESCAPE_PATTERN = /[.*+?^${}()|[\]\\]/gu;

const toKebabCase = (pascalCase: string): string =>
  pascalCase
    .replace(KEBAB_CASE_MID_PATTERN, "$1-$2")
    .replace(KEBAB_CASE_ACRONYM_PATTERN, "$1-$2")
    .toLowerCase();

const isFrameworkEntrypoint = (filePath: string): boolean =>
  FRAMEWORK_ENTRY_FILES.has(filePath) ||
  FRAMEWORK_ENTRY_ROOTS.some((root) => filePath.startsWith(root));

const isVueComponentFile = (filePath: string): boolean =>
  filePath.startsWith(`${COMPONENT_SCAN_ROOT}/`) && filePath.endsWith(".vue");

const buildComponentUsagePattern = (componentName: string): RegExp => {
  const kebabName = toKebabCase(componentName);
  const escapedPascal = componentName.replace(REGEX_ESCAPE_PATTERN, "\\$&");
  const escapedKebab = kebabName.replace(REGEX_ESCAPE_PATTERN, "\\$&");
  return new RegExp(
    `<${escapedPascal}\\b|<${escapedKebab}\\b|Lazy${escapedPascal}\\b|lazy-${escapedKebab}\\b`,
    "u",
  );
};

const collectRegisteredIconNames = (registryContent: string | undefined): Set<string> => {
  if (!registryContent) {
    return new Set();
  }
  const registeredNames = new Set<string>();
  let inRegistryBlock = false;
  for (const rawLine of registryContent.split(LINE_BREAK_PATTERN)) {
    if (rawLine.includes("APP_ICON_COMPONENTS")) {
      inRegistryBlock = true;
      continue;
    }
    if (inRegistryBlock && rawLine.includes("} as const")) {
      break;
    }
    if (!inRegistryBlock) {
      continue;
    }
    ICON_REGISTRY_ENTRY_PATTERN.lastIndex = 0;
    const match = ICON_REGISTRY_ENTRY_PATTERN.exec(rawLine);
    if (match?.[1]) {
      registeredNames.add(match[1]);
    }
  }
  return registeredNames;
};

export const collectDeadVueComponentViolationsForContent = (
  filePath: string,
  consumerSources: readonly { filePath: string; content: string }[],
  registeredIconNames: Set<string>,
): ValidationViolation[] => {
  if (!isVueComponentFile(filePath) || isFrameworkEntrypoint(filePath)) {
    return [];
  }

  const componentName = filePath.split("/").pop()?.replace(VUE_EXTENSION_PATTERN, "");
  if (!componentName) {
    return [];
  }

  if (registeredIconNames.has(componentName)) {
    return [];
  }

  const usagePattern = buildComponentUsagePattern(componentName);
  const hasConsumer = consumerSources.some((source) => {
    if (source.filePath === filePath) {
      return false;
    }
    if (source.filePath.endsWith(".test.ts") || source.filePath.endsWith(".spec.ts")) {
      return false;
    }
    return usagePattern.test(source.content);
  });

  return hasConsumer
    ? []
    : [
        {
          filePath,
          line: 1,
          message: `Vue component "${componentName}" has no template or import consumer. Remove the dead component or wire it into a real page/layout.`,
        },
      ];
};

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const consumerSources = await collectProjectFileEntries({
    scanRoots: ["packages/client"],
    allowedExtensions: new Set([".vue", ".ts"]),
  });

  const registryEntry = consumerSources.find((source) => source.filePath === ICON_REGISTRY_PATH);
  const registeredIconNames = collectRegisteredIconNames(registryEntry?.content);

  const componentFiles = consumerSources.filter(
    ({ filePath }) => isVueComponentFile(filePath) && !isFrameworkEntrypoint(filePath),
  );

  return componentFiles.flatMap(({ filePath }) =>
    collectDeadVueComponentViolationsForContent(filePath, consumerSources, registeredIconNames),
  );
};

if (import.meta.main) {
  await reportViolations(
    "Dead Vue component validation failed:",
    await collectViolations(),
    "Dead Vue component validation passed.",
  );
}
