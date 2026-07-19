import { join } from "node:path";
import { settle } from "../packages/shared/src/utils/promise";
import { reportViolations, type ValidationViolation } from "./utils/validation-helpers";

export type StackVersionPin = {
  packageName: string;
  /** Exact installed version required (from workspace resolution). */
  requiredInstalled: string;
  /** Optional semver-ish prefix the installed version must start with. */
  requiredPrefix?: string;
  resolveFromPackage: string;
};

/**
 * Contract pins from docs/STACK-CONTRACT.md + root package.json overrides.
 * Fail closed when installed resolution drifts from these pins.
 */
export const STACK_VERSION_PINS: readonly StackVersionPin[] = [
  {
    packageName: "elysia",
    requiredInstalled: "2.0.0-exp.45",
    requiredPrefix: "2.0.0-exp.",
    resolveFromPackage: "packages/server",
  },
  {
    packageName: "@elysiajs/eden",
    requiredInstalled: "1.4.9",
    resolveFromPackage: "packages/client",
  },
  {
    packageName: "@elysiajs/openapi",
    requiredInstalled: "2.0.0-exp.0",
    requiredPrefix: "2.0.0-exp.",
    resolveFromPackage: "packages/server",
  },
] as const;

export type ResolvedPackageVersion = {
  packageName: string;
  installedVersion: string;
  packageJsonPath: string;
};

export const readPackageVersionFromJson = (
  packageName: string,
  packageJsonContent: string,
): string | null => {
  const parsed: unknown = JSON.parse(packageJsonContent);
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("version" in parsed) ||
    typeof parsed.version !== "string"
  ) {
    return null;
  }
  if (!("name" in parsed) || parsed.name !== packageName) {
    return null;
  }
  return parsed.version;
};

export const collectStackVersionViolations = (
  pins: readonly StackVersionPin[],
  resolved: ReadonlyArray<ResolvedPackageVersion | { packageName: string; error: string }>,
  rootOverrides: Readonly<Record<string, string>>,
): ValidationViolation[] => {
  const violations: ValidationViolation[] = [];
  const byName = new Map(resolved.map((entry) => [entry.packageName, entry]));

  for (const pin of pins) {
    const override = rootOverrides[pin.packageName];
    if (override && override !== pin.requiredInstalled) {
      violations.push({
        filePath: "package.json",
        line: 1,
        message: `Root override for "${pin.packageName}" is "${override}" but STACK pin requires "${pin.requiredInstalled}".`,
      });
    }

    const entry = byName.get(pin.packageName);
    if (!entry) {
      violations.push({
        filePath: pin.resolveFromPackage,
        line: 1,
        message: `Missing resolved install for "${pin.packageName}".`,
      });
      continue;
    }
    if ("error" in entry) {
      violations.push({
        filePath: pin.resolveFromPackage,
        line: 1,
        message: `Failed to resolve "${pin.packageName}": ${entry.error}`,
      });
      continue;
    }
    if (entry.installedVersion !== pin.requiredInstalled) {
      violations.push({
        filePath: entry.packageJsonPath,
        line: 1,
        message: `Installed "${pin.packageName}@${entry.installedVersion}" drifts from STACK pin "${pin.requiredInstalled}".`,
      });
    }
    if (pin.requiredPrefix && !entry.installedVersion.startsWith(pin.requiredPrefix)) {
      violations.push({
        filePath: entry.packageJsonPath,
        line: 1,
        message: `Installed "${pin.packageName}@${entry.installedVersion}" must start with "${pin.requiredPrefix}" (Elysia 2 / OpenAPI 2 contract).`,
      });
    }
  }

  return violations;
};

const resolveInstalledPackage = async (
  rootDir: string,
  pin: StackVersionPin,
): Promise<ResolvedPackageVersion | { packageName: string; error: string }> => {
  const fromPackageDir = join(rootDir, pin.resolveFromPackage);
  const resolveResult = await settle(
    Promise.resolve().then(() => Bun.resolveSync(`${pin.packageName}/package.json`, fromPackageDir)),
  );
  if (resolveResult.status === "rejected") {
    return {
      packageName: pin.packageName,
      error: resolveResult.reason.message,
    };
  }
  const resolvedPath = resolveResult.value;
  const content = await Bun.file(resolvedPath).text();
  const version = readPackageVersionFromJson(pin.packageName, content);
  if (!version) {
    return {
      packageName: pin.packageName,
      error: `package.json at ${resolvedPath} missing name/version for ${pin.packageName}`,
    };
  }
  return {
    packageName: pin.packageName,
    installedVersion: version,
    packageJsonPath: resolvedPath.replace(/\\/gu, "/").replace(`${rootDir.replace(/\\/gu, "/")}/`, ""),
  };
};

export const collectWorkspaceStackVersionViolations = async (
  rootDir: string = process.cwd(),
): Promise<ValidationViolation[]> => {
  const rootPackageJson = JSON.parse(await Bun.file(join(rootDir, "package.json")).text()) as {
    overrides?: Record<string, string>;
  };
  const overrides = rootPackageJson.overrides ?? {};
  const resolved = await Promise.all(
    STACK_VERSION_PINS.map((pin) => resolveInstalledPackage(rootDir, pin)),
  );
  return collectStackVersionViolations(STACK_VERSION_PINS, resolved, overrides);
};

if (import.meta.main) {
  await reportViolations(
    "Stack version pin validation failed:",
    await collectWorkspaceStackVersionViolations(),
    "Stack version pin validation passed (installed == STACK-CONTRACT pins).",
  );
}
