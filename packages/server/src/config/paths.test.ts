import { afterEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const REPO_ROOT = resolve(import.meta.dir, "..", "..", "..", "..");
const TEMP_ROOT_PREFIX = join(tmpdir(), "bao-server-paths-");
const tempRoots: string[] = [];

const createTempRuntimeRoot = async (): Promise<string> => {
  const tempRoot = await mkdtemp(TEMP_ROOT_PREFIX);
  tempRoots.push(tempRoot);
  const scraperRoot = join(tempRoot, "scraper");
  await mkdir(scraperRoot, { recursive: true });
  await writeFile(
    join(scraperRoot, "package.json"),
    JSON.stringify({ name: "@bao/scraper", private: true }, null, 2),
    "utf8",
  );
  return tempRoot;
};

const resolveScraperDirForCwd = async (cwd: string): Promise<string> => {
  const moduleUrl = pathToFileURL(
    join(REPO_ROOT, "packages", "server", "src", "config", "paths.ts"),
  ).href;
  const script = [
    "const moduleUrl = process.argv[1];",
    "const runtimeCwd = process.argv[2];",
    "process.chdir(runtimeCwd);",
    "const paths = await import(moduleUrl);",
    "await Bun.write(Bun.stdout, paths.SCRAPER_DIR);",
  ].join("\n");
  const proc = Bun.spawn([process.execPath, "-e", script, moduleUrl, cwd], {
    cwd: REPO_ROOT,
    env: {
      ...process.env,
      BAO_SCRAPER_DIR: "",
    },
    stdout: "pipe",
    stderr: "pipe",
  });
  const [exitCode, stdout, stderr] = await Promise.all([
    proc.exited,
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);

  expect(exitCode).toBe(0);
  expect(stderr.trim()).toBe("");
  return stdout.trim();
};

afterEach(async () => {
  await Promise.all(
    tempRoots.splice(0).map((tempRoot) =>
      rm(tempRoot, {
        recursive: true,
        force: true,
      }),
    ),
  );
});

describe("server config paths", () => {
  test("resolves the packaged runtime scraper directory from the current working directory", async () => {
    const runtimeRoot = await createTempRuntimeRoot();
    const scraperDir = await resolveScraperDirForCwd(runtimeRoot);

    expect(scraperDir).toBe(await realpath(join(runtimeRoot, "scraper")));
  });
});
