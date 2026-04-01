import { readdir } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { writeError, writeOutput } from "./utils/cli-output";

const REPO_ROOT = resolve(import.meta.dir, "..");
const CLIENT_OUTPUT_SERVER = join(REPO_ROOT, "packages", "client", ".output", "server");
const CLIENT_OUTPUT_PUBLIC = join(REPO_ROOT, "packages", "client", ".output", "public");

const pathExists = async (absolutePath: string): Promise<boolean> =>
  readdir(absolutePath).then(
    () => true,
    () => false,
  );

const collectMapFilesRecursive = async (
  directoryPath: string,
  accumulator: string[],
): Promise<void> => {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      const entryPath = join(directoryPath, entry.name);
      if (entry.isDirectory()) {
        await collectMapFilesRecursive(entryPath, accumulator);
        return;
      }
      if (entry.isFile() && entry.name.endsWith(".map")) {
        accumulator.push(entryPath);
      }
    }),
  );
};

const verifyNoSourceMapsUnder = async (
  rootLabel: string,
  absoluteRoot: string,
): Promise<readonly string[]> => {
  if (!(await pathExists(absoluteRoot))) {
    await writeOutput(`verify:production-client skip ${rootLabel} (directory missing)`);
    return [] as const;
  }

  const mapPaths: string[] = [];
  await collectMapFilesRecursive(absoluteRoot, mapPaths);
  return mapPaths.map((mapPath) => relative(REPO_ROOT, mapPath));
};

const main = async (): Promise<void> => {
  const [serverMaps, publicMaps] = await Promise.all([
    verifyNoSourceMapsUnder("ssr-output", CLIENT_OUTPUT_SERVER),
    verifyNoSourceMapsUnder("static-public", CLIENT_OUTPUT_PUBLIC),
  ]);
  const unexpectedMaps = [...serverMaps, ...publicMaps].sort((left, right) =>
    left.localeCompare(right),
  );

  if (unexpectedMaps.length > 0) {
    await writeError(
      `verify:production-client failed: unexpected source map files under .output:\n${unexpectedMaps.join("\n")}`,
    );
    process.exit(1);
  }

  await writeOutput(
    "verify:production-client passed (no .map under packages/client/.output/server|public).",
  );
};

await main().then(undefined, async (error: unknown) => {
  await writeError(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
