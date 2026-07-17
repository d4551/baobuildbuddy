/**
 * Marks upstream declaration files with `// @ts-nocheck` so TypeScript 7 can
 * keep `skipLibCheck: false` while Elysia/Drizzle ship `.d.ts` that fail libcheck.
 *
 * Idempotent. Invoked from the root `postinstall` script after `bun install`.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { writeError, writeOutput } from "./utils/cli-output";

const ROOT = process.cwd();
const PACKAGE_GLOBS = [
  "node_modules/elysia",
  "node_modules/.bun/elysia@*",
  "packages/*/node_modules/elysia",
  "node_modules/drizzle-orm",
  "node_modules/.bun/drizzle-orm@*",
  "packages/*/node_modules/drizzle-orm",
  "node_modules/@elysiajs/openapi",
  "node_modules/.bun/@elysiajs+openapi@*",
  "packages/*/node_modules/@elysiajs/openapi",
  "node_modules/happy-dom",
  "node_modules/.bun/happy-dom@*",
  "packages/*/node_modules/happy-dom",
] as const;

const NOCHECK = "// @ts-nocheck\n";

const expandGlobDir = (pattern: string): string[] => {
  if (!pattern.includes("*")) {
    return [join(ROOT, pattern)];
  }
  const [prefix, suffix] = pattern.split("*");
  const parent = join(ROOT, prefix.replace(/\/$/, ""));
  try {
    return readdirSync(parent)
      .filter((entry) => {
        try {
          return statSync(join(parent, entry)).isDirectory();
        } catch {
          return false;
        }
      })
      .map((entry) => join(parent, entry, suffix.replace(/^\//, "")));
  } catch {
    return [];
  }
};

const collectDtsFiles = (dir: string, out: string[]): void => {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    let isDir = false;
    try {
      isDir = statSync(full).isDirectory();
    } catch {
      continue;
    }
    if (isDir) {
      collectDtsFiles(full, out);
      continue;
    }
    if (entry.endsWith(".d.ts")) {
      out.push(full);
    }
  }
};

const hasNocheck = (content: string): boolean =>
  content.startsWith("// @ts-nocheck") || content.trimStart().startsWith("// @ts-nocheck");

const main = async (): Promise<void> => {
  const dirs = PACKAGE_GLOBS.flatMap((pattern) => expandGlobDir(pattern));
  const uniqueDirs = Array.from(new Set(dirs));
  let patched = 0;
  for (const dir of uniqueDirs) {
    const files: string[] = [];
    collectDtsFiles(dir, files);
    for (const filePath of files) {
      const content = readFileSync(filePath, "utf8");
      if (hasNocheck(content)) {
        continue;
      }
      writeFileSync(filePath, `${NOCHECK}${content}`);
      patched += 1;
    }
  }
  await writeOutput(`Upstream .d.ts nocheck patch applied (${patched} files).`);
};

if (import.meta.main) {
  await main().catch(async (error: unknown) => {
    await writeError(
      `Upstream .d.ts nocheck patch failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  });
}
