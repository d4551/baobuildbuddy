import { realpath } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

type PackageDependencyMap = Record<string, string>;

type PackageManifest = {
  dependencies: PackageDependencyMap;
  optionalDependencies: PackageDependencyMap;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isDependencyMap = (value: unknown): value is PackageDependencyMap =>
  isRecord(value) && Object.values(value).every((entry) => typeof entry === "string");

const readPackageManifest = async (packageRoot: string): Promise<PackageManifest> => {
  const rawManifest: unknown = JSON.parse(await Bun.file(join(packageRoot, "package.json")).text());
  if (!isRecord(rawManifest)) {
    throw new Error(`Expected package manifest object at ${join(packageRoot, "package.json")}`);
  }

  return {
    dependencies: isDependencyMap(rawManifest.dependencies) ? rawManifest.dependencies : {},
    optionalDependencies: isDependencyMap(rawManifest.optionalDependencies)
      ? rawManifest.optionalDependencies
      : {},
  };
};

const resolvePackageManifestPath = async (
  packageName: string,
  fromPackageRoot: string,
): Promise<string> => {
  const packageResolver = createRequire(join(fromPackageRoot, "package.json"));
  try {
    return await realpath(packageResolver.resolve(`${packageName}/package.json`));
  } catch (error) {
    throw new Error(
      `Unable to resolve packaged scraper dependency "${packageName}" from ${fromPackageRoot}: ${
        error instanceof Error ? error.message : String(error)
      }`,
      { cause: error },
    );
  }
};

const sortDependencyNames = (dependencyMap: PackageDependencyMap): string[] =>
  Object.keys(dependencyMap).sort((left, right) => left.localeCompare(right));

const visitOptionalDependencies = async (
  packageRoot: string,
  optionalDependencies: PackageDependencyMap,
  visitedPackages: Map<string, string>,
): Promise<void> => {
  for (const dependencyName of sortDependencyNames(optionalDependencies)) {
    const sourceRoot = await resolvePackageSourceRoot(dependencyName, packageRoot).catch(
      () => null,
    );
    if (sourceRoot !== null) {
      await visitRuntimeDependencyTree(dependencyName, sourceRoot, visitedPackages);
    }
  }
};

const visitRuntimeDependencyTree = async (
  packageName: string,
  packageRoot: string,
  visitedPackages: Map<string, string>,
): Promise<void> => {
  const existingRoot = visitedPackages.get(packageName);
  if (existingRoot) {
    if (existingRoot !== packageRoot) {
      throw new Error(
        `Packaged scraper runtime dependency "${packageName}" resolved to multiple package roots: ${existingRoot} and ${packageRoot}`,
      );
    }
    return;
  }

  visitedPackages.set(packageName, packageRoot);
  const manifest = await readPackageManifest(packageRoot);

  for (const dependencyName of sortDependencyNames(manifest.dependencies)) {
    const dependencyRoot = await resolvePackageSourceRoot(dependencyName, packageRoot);
    await visitRuntimeDependencyTree(dependencyName, dependencyRoot, visitedPackages);
  }

  await visitOptionalDependencies(packageRoot, manifest.optionalDependencies, visitedPackages);
};

/**
 * Files and directories that make up the scraper package source contract inside the desktop runtime.
 */
export const SCRAPER_RUNTIME_STAGE_SOURCE_PATHS = ["package.json", "src", "tsconfig.json"] as const;

/**
 * Resolve the real package root for a Bun-installed dependency from the perspective of another package.
 */
export const resolvePackageSourceRoot = async (
  packageName: string,
  fromPackageRoot: string,
): Promise<string> => dirname(await resolvePackageManifestPath(packageName, fromPackageRoot));

/**
 * Collect the flattened production dependency closure required by the packaged scraper runtime.
 */
export const collectRuntimeDependencySourceRoots = async (
  packageRoot: string,
): Promise<ReadonlyMap<string, string>> => {
  const visitedPackages = new Map<string, string>();
  const manifest = await readPackageManifest(packageRoot);

  for (const dependencyName of sortDependencyNames(manifest.dependencies)) {
    const dependencyRoot = await resolvePackageSourceRoot(dependencyName, packageRoot);
    await visitRuntimeDependencyTree(dependencyName, dependencyRoot, visitedPackages);
  }

  await visitOptionalDependencies(packageRoot, manifest.optionalDependencies, visitedPackages);
  return visitedPackages;
};
