import { afterAll, describe, expect, mock, test } from "bun:test";
import { mkdir, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import type * as NodeModuleNamespace from "node:module";

type PackageManifest = {
  readonly name: string;
  readonly version: string;
  readonly dependencies?: Record<string, string>;
  readonly optionalDependencies?: Record<string, string>;
};

type DesktopRuntimeScraperModule = {
  readonly collectRuntimeDependencySourceRoots: (
    packageRoot: string,
  ) => Promise<ReadonlyMap<string, string>>;
};

const isDesktopRuntimeScraperModule = (value: unknown): value is DesktopRuntimeScraperModule =>
  typeof value === "object" &&
  value !== null &&
  typeof Reflect.get(value, "collectRuntimeDependencySourceRoots") === "function";

const writeJsonFile = async (filePath: string, value: PackageManifest): Promise<void> => {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
};

const fixtureRoot = await mkdtemp(join(tmpdir(), "bao-desktop-runtime-scraper-"));
const requiredPackageManifestPath = join(
  fixtureRoot,
  "node_modules",
  "required-dependency",
  "package.json",
);

await writeJsonFile(join(fixtureRoot, "package.json"), {
  name: "fixture-root",
  version: "1.0.0",
  dependencies: {
    "required-dependency": "1.0.0",
  },
  optionalDependencies: {
    "broken-optional-dependency": "1.0.0",
  },
});

await writeJsonFile(requiredPackageManifestPath, {
  name: "required-dependency",
  version: "1.0.0",
});
const requiredPackageRoot = await realpath(join(fixtureRoot, "node_modules", "required-dependency"));

const nodeModule: typeof NodeModuleNamespace = await import("node:module");
await mock.module("node:module", () => ({
  ...nodeModule,
  createRequire: () => ({
    resolve(specifier: string): string {
      if (specifier === "required-dependency/package.json") {
        return requiredPackageManifestPath;
      }

      if (specifier === "broken-optional-dependency/package.json") {
        throw new Error("Unexpected error.");
      }

      throw new Error(`Unexpected package resolution request: ${specifier}`);
    },
  }),
}));

const desktopRuntimeScraperModuleUrl = new URL(
  "../../../../scripts/utils/desktop-runtime-scraper.ts",
  import.meta.url,
);
const desktopRuntimeScraperModuleValue: unknown = await import(desktopRuntimeScraperModuleUrl.href);
if (!isDesktopRuntimeScraperModule(desktopRuntimeScraperModuleValue)) {
  throw new Error("desktop-runtime-scraper module did not expose collectRuntimeDependencySourceRoots");
}
const desktopRuntimeScraperModule = desktopRuntimeScraperModuleValue;
const { collectRuntimeDependencySourceRoots } = desktopRuntimeScraperModule;

describe("collectRuntimeDependencySourceRoots", () => {
  test("skips optional dependencies that Bun cannot resolve on the current host", async () => {
    const runtimeDependencyRoots = await collectRuntimeDependencySourceRoots(fixtureRoot);

    expect(runtimeDependencyRoots.size).toBe(1);
    expect(runtimeDependencyRoots.get("required-dependency")).toBe(requiredPackageRoot);
    expect(runtimeDependencyRoots.has("broken-optional-dependency")).toBe(false);
  });
});

afterAll(async () => {
  mock.restore();
  await rm(fixtureRoot, { recursive: true, force: true });
});
