import { realpath } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { captureResult, toErrorMessage } from "./async-control";

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
  const manifestPathResult = await captureResult(() =>
    realpath(packageResolver.resolve(`${packageName}/package.json`)),
  );
  if (manifestPathResult.ok) {
    return manifestPathResult.value;
  }

  throw new Error(
    `Unable to resolve packaged scraper dependency "${packageName}" from ${fromPackageRoot}: ${toErrorMessage(
      manifestPathResult.error,
    )}`,
    { cause: manifestPathResult.error },
  );
};

const sortDependencyNames = (dependencyMap: PackageDependencyMap): string[] =>
  Object.keys(dependencyMap).sort((left, right) => left.localeCompare(right));

const visitDependencyNamesSequentially = async (
  dependencyNames: readonly string[],
  visitor: (dependencyName: string) => Promise<void>,
  index: number = 0,
): Promise<void> => {
  const dependencyName = dependencyNames[index];
  if (!dependencyName) {
    return;
  }

  await visitor(dependencyName);
  await visitDependencyNamesSequentially(dependencyNames, visitor, index + 1);
};

const visitOptionalDependencies = async (
  packageRoot: string,
  optionalDependencies: PackageDependencyMap,
  visitedPackages: Map<string, string>,
): Promise<void> => {
  await visitDependencyNamesSequentially(
    sortDependencyNames(optionalDependencies),
    async (dependencyName) => {
      // Optional dependencies are allowed to be missing from the host install tree.
      // Bun may surface that absence as MODULE_NOT_FOUND or as a generic resolver error.
      const sourceRootResult = await captureResult(() =>
        resolvePackageSourceRoot(dependencyName, packageRoot),
      );
      if (!sourceRootResult.ok) {
        return;
      }

      await visitRuntimeDependencyTree(dependencyName, sourceRootResult.value, visitedPackages);
    },
  );
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

  await visitDependencyNamesSequentially(
    sortDependencyNames(manifest.dependencies),
    async (dependencyName) => {
      const dependencyRoot = await resolvePackageSourceRoot(dependencyName, packageRoot);
      await visitRuntimeDependencyTree(dependencyName, dependencyRoot, visitedPackages);
    },
  );

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

  await visitDependencyNamesSequentially(
    sortDependencyNames(manifest.dependencies),
    async (dependencyName) => {
      const dependencyRoot = await resolvePackageSourceRoot(dependencyName, packageRoot);
      await visitRuntimeDependencyTree(dependencyName, dependencyRoot, visitedPackages);
    },
  );

  await visitOptionalDependencies(packageRoot, manifest.optionalDependencies, visitedPackages);
  return visitedPackages;
};
