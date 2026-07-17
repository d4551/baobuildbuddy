import { join, relative, resolve } from "node:path";
import {
  DESKTOP_RELEASE_TARGETS,
  DESKTOP_RUNTIME_MANIFEST_PATH,
} from "../../packages/shared/src/constants/scripts";
import { RPA_PROTOCOL_VERSION } from "../../packages/shared/src/schemas/rpa-protocol.schema";

type JsonRecord = Record<string, unknown>;

type WorkspacePackageSummary = {
  readonly name: string;
  readonly path: string;
  readonly scripts: readonly string[];
};

type AgentiflowCapabilityMatrix = {
  readonly generatedAt: string;
  readonly repository: {
    readonly name: string;
    readonly packageManager: string;
    readonly workspaceGlobs: readonly string[];
  };
  readonly stack: {
    readonly runtime: string;
    readonly language: string;
    readonly frontend: string;
    readonly styling: readonly string[];
    readonly backend: string;
    readonly database: string;
    readonly automation: string;
    readonly desktop: string;
  };
  readonly validation: {
    readonly requiredScripts: readonly string[];
    readonly missingScripts: readonly string[];
  };
  readonly desktop: {
    readonly releaseTargets: readonly string[];
    readonly workflowPath: string;
    readonly releaseScripts: Readonly<Record<string, string>>;
    readonly verificationScripts: readonly string[];
    readonly runtimeManifestPath: string;
  };
  readonly automationRpa: {
    readonly protocolVersion: string;
    readonly docs: readonly string[];
    readonly runtimeScripts: readonly string[];
    readonly serverContracts: readonly string[];
    readonly clientPages: readonly string[];
  };
  readonly agentiflow: {
    readonly rootRuleCopies: readonly string[];
    readonly protocolFiles: readonly string[];
    readonly requiredScripts: readonly string[];
    readonly scriptCoverage: Readonly<Record<string, boolean>>;
  };
  readonly workspaces: readonly WorkspacePackageSummary[];
};

const REPO_ROOT = resolve(import.meta.dir, "../..");

/**
 * Absolute path to the generated Agentiflow capability matrix file.
 */
export const AGENTIFLOW_CAPABILITY_MATRIX_PATH = join(
  REPO_ROOT,
  "agentiflow",
  "capability-matrix.generated.json",
);

const ROOT_PACKAGE_JSON_PATH = join(REPO_ROOT, "package.json");
const PACKAGE_JSON_SUFFIX_PATTERN = /\/package\.json$/u;
const AGENTIFLOW_REQUIRED_SCRIPT_NAMES = [
  "build",
  "lint",
  "typecheck",
  "test",
  "format:check",
  "verify:desktop-runtime",
  "verify:desktop-releases",
  "release:verify",
  "capability:matrix",
  "capability:matrix:check",
] as const;

const AUTOMATION_DOC_PATHS = ["README.md", "docs/AUTOMATION.md"] as const;
const AUTOMATION_RUNTIME_SCRIPT_PATHS = [
  "packages/scraper/src/scripts/job-apply.ts",
  "packages/scraper/src/job-apply/runtime.ts",
  "packages/scraper/src/runtime/protocol.ts",
  "packages/server/src/services/automation/rpa-runner-protocol.ts",
  "packages/server/src/services/automation/rpa-runner-process.ts",
  "packages/server/src/services/automation/application-automation-service.ts",
] as const;
const AUTOMATION_SERVER_CONTRACT_PATHS = [
  "packages/server/src/routes/automation.routes.ts",
  "packages/server/src/ws/automation.ws.ts",
  "packages/shared/src/schemas/rpa-protocol.schema.ts",
  "packages/shared/src/schemas/rpa-events.schema.ts",
] as const;
const ROOT_RULE_COPY_CANDIDATES = ["AGENTS.md", "CLAUDE.md", "GEMINI.md"] as const;

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toTextValue = (value: unknown, fallbackValue: string): string =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : fallbackValue;

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];

const toRelativePath = (absolutePath: string): string =>
  relative(REPO_ROOT, absolutePath).replaceAll("\\", "/");

const readJsonObject = async (filePath: string): Promise<JsonRecord> => {
  const parsed: unknown = JSON.parse(await Bun.file(filePath).text());
  if (!isRecord(parsed)) {
    throw new Error(`Expected JSON object in ${filePath}.`);
  }

  return parsed;
};

const collectWorkspacePackageSummaries = async (): Promise<WorkspacePackageSummary[]> => {
  const packageJsonGlob = new Bun.Glob("packages/*/package.json");
  const packageJsonPaths = Array.fromAsync(
    packageJsonGlob.scan({
      cwd: REPO_ROOT,
      onlyFiles: true,
    }),
  );

  const manifests = await Promise.all(
    (await packageJsonPaths).map(async (packageJsonPath) => {
      const manifest = await readJsonObject(join(REPO_ROOT, packageJsonPath));
      const scripts = isRecord(manifest.scripts) ? Object.keys(manifest.scripts).sort() : [];

      return {
        name: toTextValue(manifest.name, packageJsonPath),
        path: packageJsonPath.replace(PACKAGE_JSON_SUFFIX_PATTERN, ""),
        scripts,
      } satisfies WorkspacePackageSummary;
    }),
  );

  return manifests.sort((left, right) => left.path.localeCompare(right.path));
};

const collectAutomationClientPages = async (): Promise<string[]> => {
  const pageGlob = new Bun.Glob("packages/client/pages/automation/**/*.vue");
  const paths = await Array.fromAsync(
    pageGlob.scan({
      cwd: REPO_ROOT,
      onlyFiles: true,
    }),
  );

  return paths.sort((left, right) => left.localeCompare(right));
};

const GENERATED_CAPABILITY_MATRIX_SEGMENT = "capability-matrix.generated.json" as const;

const collectProtocolFiles = async (): Promise<string[]> => {
  const protocolGlob = new Bun.Glob("agentiflow/*");
  const protocolPaths = await Array.fromAsync(
    protocolGlob.scan({
      cwd: REPO_ROOT,
      onlyFiles: true,
    }),
  );

  return protocolPaths
    .filter((path) => !path.endsWith(GENERATED_CAPABILITY_MATRIX_SEGMENT))
    .sort((left, right) => left.localeCompare(right));
};

const collectRootRuleCopies = async (): Promise<string[]> => {
  const rootRuleCopies = await Promise.all(
    ROOT_RULE_COPY_CANDIDATES.map(async (fileName) =>
      (await Bun.file(join(REPO_ROOT, fileName)).exists()) ? fileName : null,
    ),
  );

  return rootRuleCopies.filter((value) => value !== null);
};

const buildReleaseScripts = (
  rootScriptNames: readonly string[],
  rootScripts: JsonRecord,
): Readonly<Record<string, string>> =>
  Object.fromEntries(
    rootScriptNames
      .filter((scriptName) => scriptName.startsWith("release:desktop:"))
      .map((scriptName) => [scriptName, toTextValue(rootScripts[scriptName], "")]),
  );

const buildValidationSection = (rootScriptNames: readonly string[]) => ({
  requiredScripts: AGENTIFLOW_REQUIRED_SCRIPT_NAMES,
  missingScripts: AGENTIFLOW_REQUIRED_SCRIPT_NAMES.filter(
    (scriptName) => !rootScriptNames.includes(scriptName),
  ),
});

const buildDesktopSection = (
  rootScriptNames: readonly string[],
  rootScripts: JsonRecord,
): AgentiflowCapabilityMatrix["desktop"] => ({
  releaseTargets: DESKTOP_RELEASE_TARGETS,
  workflowPath: ".github/workflows/desktop-release.yml",
  releaseScripts: buildReleaseScripts(rootScriptNames, rootScripts),
  verificationScripts: [
    "scripts/verify-desktop-runtime.ts",
    "scripts/verify-desktop-release-artifacts.ts",
    "scripts/verify-production-client-output.ts",
    "scripts/release-verify.ts",
  ],
  runtimeManifestPath: `packages/desktop/src-tauri/${DESKTOP_RUNTIME_MANIFEST_PATH}`,
});

const buildAgentiflowSection = (
  rootRuleCopies: readonly string[],
  protocolFiles: readonly string[],
  rootScriptNames: readonly string[],
): AgentiflowCapabilityMatrix["agentiflow"] => ({
  rootRuleCopies,
  protocolFiles,
  requiredScripts: ["capability:matrix", "capability:matrix:check"],
  scriptCoverage: {
    capabilityMatrix: rootScriptNames.includes("capability:matrix"),
    capabilityMatrixCheck: rootScriptNames.includes("capability:matrix:check"),
    releaseVerify: rootScriptNames.includes("release:verify"),
    desktopRuntimeVerify: rootScriptNames.includes("verify:desktop-runtime"),
  },
});

const buildRepositorySection = (
  rootPackageJson: JsonRecord,
  workspaceGlobs: readonly string[],
): AgentiflowCapabilityMatrix["repository"] => ({
  name: toTextValue(rootPackageJson.name, "bao-build-buddy"),
  packageManager: toTextValue(rootPackageJson.packageManager, "bun"),
  workspaceGlobs,
});

const buildStackSection = (): AgentiflowCapabilityMatrix["stack"] => ({
  runtime: "Bun 1.3.x",
  language: "TypeScript (strict)",
  frontend: "Nuxt 4 SSR",
  styling: ["Tailwind CSS 4", "DaisyUI 5"],
  backend: "Elysia",
  database: "Drizzle ORM + SQLite",
  automation: "Playwright RPA",
  desktop: "Tauri 2",
});

/**
 * Builds the generated Agentiflow capability matrix for the current repository state.
 *
 * @returns Deterministic capability matrix aligned to this workspace.
 */
export const buildAgentiflowCapabilityMatrix = async (): Promise<AgentiflowCapabilityMatrix> => {
  const rootPackageJson = await readJsonObject(ROOT_PACKAGE_JSON_PATH);
  const rootScripts = isRecord(rootPackageJson.scripts) ? rootPackageJson.scripts : {};
  const rootScriptNames = Object.keys(rootScripts).sort();
  const workspaceGlobs = toStringArray(rootPackageJson.workspaces);
  const workspaces = await collectWorkspacePackageSummaries();
  const automationClientPages = await collectAutomationClientPages();
  const protocolFiles = await collectProtocolFiles();
  const rootRuleCopies = await collectRootRuleCopies();

  return {
    generatedAt: new Date().toISOString(),
    repository: buildRepositorySection(rootPackageJson, workspaceGlobs),
    stack: buildStackSection(),
    validation: buildValidationSection(rootScriptNames),
    desktop: buildDesktopSection(rootScriptNames, rootScripts),
    automationRpa: {
      protocolVersion: RPA_PROTOCOL_VERSION,
      docs: AUTOMATION_DOC_PATHS,
      runtimeScripts: AUTOMATION_RUNTIME_SCRIPT_PATHS,
      serverContracts: AUTOMATION_SERVER_CONTRACT_PATHS,
      clientPages: automationClientPages,
    },
    agentiflow: buildAgentiflowSection(rootRuleCopies, protocolFiles, rootScriptNames),
    workspaces,
  };
};

/**
 * Resolves the repo-relative capability matrix path for log output and diagnostics.
 *
 * @returns Repo-relative matrix path.
 */
export const resolveAgentiflowCapabilityMatrixRelativePath = (): string =>
  toRelativePath(AGENTIFLOW_CAPABILITY_MATRIX_PATH);
