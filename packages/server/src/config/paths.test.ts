import { afterEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { resolveScraperDirectory } from "./scraper-dir-resolve";

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
    const scraperDir = resolveScraperDirectory(runtimeRoot);

    expect(await realpath(scraperDir)).toBe(await realpath(join(runtimeRoot, "scraper")));
  });

  test("prefers explicit configured scraper directory over cwd candidates", async () => {
    const runtimeRoot = await createTempRuntimeRoot();
    const configured = join(runtimeRoot, "scraper");
    const scraperDir = resolveScraperDirectory("/var/empty-nonexistent-cwd", configured);

    expect(scraperDir).toBe(resolve(configured));
  });
});
