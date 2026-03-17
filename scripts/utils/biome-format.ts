import { writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const REPO_ROOT = resolve(import.meta.dir, "../..");
const BIOME_EXECUTABLE_PATH = join(
  REPO_ROOT,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "biome.cmd" : "biome",
);
const TEXT_ENCODER = new TextEncoder();

const readStreamText = async (
  stream: number | ReadableStream<Uint8Array> | undefined,
): Promise<string> => {
  if (!(stream instanceof ReadableStream)) {
    return "";
  }

  return (await new Response(stream).text()).trim();
};

const formatTextWithBiomeFromStdin = async (
  filePathHint: string,
  text: string,
): Promise<string> => {
  const proc = Bun.spawn([BIOME_EXECUTABLE_PATH, "format", `--stdin-file-path=${filePathHint}`], {
    cwd: REPO_ROOT,
    env: process.env,
    stdin: TEXT_ENCODER.encode(text),
    stdout: "pipe",
    stderr: "pipe",
  });
  const [exitCode, stdout, stderr] = await Promise.all([
    proc.exited,
    readStreamText(proc.stdout),
    readStreamText(proc.stderr),
  ]);

  if (exitCode !== 0) {
    const output = [stdout, stderr].filter((value) => value.length > 0).join("\n");
    throw new Error(
      output.length > 0
        ? `Biome failed to format stdin for ${filePathHint}.\n${output}`
        : `Biome failed to format stdin for ${filePathHint}.`,
    );
  }

  return `${stdout}\n`;
};

/**
 * Formats one or more files with the repository-local Biome binary.
 *
 * @param filePaths Absolute or repo-relative file paths to format in place.
 */
export const formatFilesWithBiome = async (filePaths: readonly string[]): Promise<void> => {
  if (filePaths.length === 0) {
    return;
  }

  const proc = Bun.spawn([BIOME_EXECUTABLE_PATH, "format", ...filePaths, "--write"], {
    cwd: REPO_ROOT,
    env: process.env,
    stdout: "pipe",
    stderr: "pipe",
  });
  const [exitCode, stdout, stderr] = await Promise.all([
    proc.exited,
    readStreamText(proc.stdout),
    readStreamText(proc.stderr),
  ]);

  if (exitCode !== 0) {
    const output = [stdout, stderr].filter((value) => value.length > 0).join("\n");
    throw new Error(
      output.length > 0
        ? `Biome failed to format ${filePaths.join(", ")}.\n${output}`
        : `Biome failed to format ${filePaths.join(", ")}.`,
    );
  }
};

/**
 * Serializes JSON with a trailing newline, then normalizes the file with Biome.
 *
 * @param filePath Absolute or repo-relative target path.
 * @param value JSON-compatible value to persist.
 */
export const writeFormattedJsonFile = async (filePath: string, value: unknown): Promise<void> => {
  await writeFile(filePath, await formatJsonWithBiome(filePath, value), "utf8");
};

/**
 * Returns the Biome-formatted JSON text for a value without mutating repository files.
 *
 * @param filePathHint Representative path used for Biome parser inference.
 * @param value JSON-compatible value to format.
 */
export const formatJsonWithBiome = async (
  filePathHint: string,
  value: unknown,
): Promise<string> => {
  return formatTextWithBiomeFromStdin(filePathHint, `${JSON.stringify(value, null, 2)}\n`);
};
