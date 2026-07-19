import { lstat, readlink, readdir } from "node:fs/promises";
import { join } from "node:path";
import { settle } from "../packages/shared/src/utils/promise";
import { IGNORED_DIRECTORY_NAMES, reportViolations, type ValidationViolation } from "./utils/validation-helpers";

/**
 * Absolute symlink targets that leak host user paths into the repo.
 * Relative targets and in-repo absolute build roots are evaluated separately.
 */
const ABS_USER_HOME_TARGET_PATTERN = /^(?:\/Users\/|\/home\/)/u;

export type AbsPathSymlinkViolation = {
  filePath: string;
  target: string;
};

export const isForbiddenAbsUserHomeSymlinkTarget = (target: string): boolean =>
  ABS_USER_HOME_TARGET_PATTERN.test(target);

export const collectAbsPathSymlinkViolationsFromEntries = (
  entries: ReadonlyArray<{ filePath: string; target: string }>,
): ValidationViolation[] =>
  entries
    .filter((entry) => isForbiddenAbsUserHomeSymlinkTarget(entry.target))
    .map((entry) => ({
      filePath: entry.filePath,
      line: 1,
      message: `Symlink target "${entry.target}" embeds an absolute user-home path. Remove the symlink; never commit host-local paths.`,
    }));

const shouldSkipDirectoryName = (name: string): boolean =>
  IGNORED_DIRECTORY_NAMES.has(name) || name === ".desktop-release-artifacts";

const walkSymlinks = async (
  absoluteDir: string,
  relativeDir: string,
  out: Array<{ filePath: string; target: string }>,
): Promise<void> => {
  const entries = await readdir(absoluteDir, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      const relativePath = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;
      const absolutePath = join(absoluteDir, entry.name);
      if (entry.isSymbolicLink()) {
        const target = await readlink(absolutePath);
        out.push({ filePath: relativePath.replace(/\\/gu, "/"), target });
        return;
      }
      if (entry.isDirectory() && !shouldSkipDirectoryName(entry.name)) {
        await walkSymlinks(absolutePath, relativePath, out);
      }
    }),
  );
};

export const collectWorkingTreeSymlinkEntries = async (
  rootDir: string = process.cwd(),
): Promise<Array<{ filePath: string; target: string }>> => {
  const out: Array<{ filePath: string; target: string }> = [];
  await walkSymlinks(rootDir, "", out);
  return out;
};

/**
 * Parse `git ls-files -s` output for mode-120000 symlink blobs and resolve targets
 * from the working tree when present.
 */
export const collectTrackedSymlinkEntriesFromGitLsFiles = async (
  gitLsFilesSOutput: string,
  readWorkingTreeTarget: (filePath: string) => Promise<string | null>,
): Promise<Array<{ filePath: string; target: string }>> => {
  const lines = gitLsFilesSOutput.split(/\r?\n/u).filter((line) => line.length > 0);
  const symlinkPaths = lines
    .map((line) => {
      const match = /^(?<mode>\d{6})\s+\S+\s+\d+\s+(?<path>.+)$/u.exec(line);
      if (!match || match.groups?.mode !== "120000") {
        return null;
      }
      return match.groups.path;
    })
    .filter((path): path is string => typeof path === "string" && path.length > 0);

  const entries = await Promise.all(
    symlinkPaths.map(async (filePath) => {
      const target = await readWorkingTreeTarget(filePath);
      if (target === null) {
        return null;
      }
      return { filePath, target };
    }),
  );
  return entries.filter((entry): entry is { filePath: string; target: string } => entry !== null);
};

const readWorkingTreeSymlinkTarget = async (filePath: string): Promise<string | null> => {
  const statsResult = await settle(lstat(filePath));
  if (statsResult.status === "rejected" || !statsResult.value.isSymbolicLink()) {
    return null;
  }
  const linkResult = await settle(readlink(filePath));
  return linkResult.status === "fulfilled" ? linkResult.value : null;
};

export const collectAbsPathSymlinkViolations = async (
  rootDir: string = process.cwd(),
): Promise<ValidationViolation[]> => {
  const workingTreeEntries = await collectWorkingTreeSymlinkEntries(rootDir);
  const gitProc = Bun.spawn(["git", "ls-files", "-s"], {
    cwd: rootDir,
    stdout: "pipe",
    stderr: "pipe",
  });
  const gitOutput = await new Response(gitProc.stdout).text();
  await gitProc.exited;
  const trackedEntries = await collectTrackedSymlinkEntriesFromGitLsFiles(
    gitOutput,
    async (filePath) => readWorkingTreeSymlinkTarget(join(rootDir, filePath)),
  );

  const byPath = new Map<string, { filePath: string; target: string }>();
  for (const entry of [...workingTreeEntries, ...trackedEntries]) {
    byPath.set(entry.filePath, entry);
  }
  return collectAbsPathSymlinkViolationsFromEntries([...byPath.values()]);
};

if (import.meta.main) {
  await reportViolations(
    "Absolute user-home symlink validation failed:",
    await collectAbsPathSymlinkViolations(),
    "Absolute user-home symlink validation passed.",
  );
}
