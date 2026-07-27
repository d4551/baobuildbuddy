import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Glob } from "bun";

/**
 * Collects repository sources into the payload the brutalise scanner accepts.
 *
 * The scan root is resolved from the working directory rather than written as an
 * absolute path: a baked-in `/Users/<name>/...` root silently produced an empty
 * payload on any other checkout, and an empty payload reads as a clean scan.
 */
const root = process.cwd();

const patterns = [
  "packages/*/src/**/*.ts",
  "packages/client/**/*.vue",
  "packages/client/**/*.css",
  "packages/client/constants/**/*.ts",
  "packages/shared/src/**/*.ts",
  "scripts/**/*.ts",
] as const;

const SKIP_PATTERN = /node_modules|\.nuxt|dist|\.output|coverage|artifacts/u;

/** Payload entry: repo-relative path plus exact on-disk bytes. */
type PayloadFile = { path: string; content: string };

// Patterns are scanned concurrently, then flattened, so no await sits in a loop.
const matchesPerPattern = await Promise.all(
  patterns.map(async (pattern) => await Array.fromAsync(new Glob(pattern).scan(root))),
);

const seen = new Set<string>();
const files: PayloadFile[] = [];

for (const relativePath of matchesPerPattern.flat()) {
  if (SKIP_PATTERN.test(relativePath) || seen.has(relativePath)) {
    continue;
  }
  seen.add(relativePath);
  const absolutePath = join(root, relativePath);
  if (!existsSync(absolutePath)) {
    continue;
  }
  files.push({ path: relativePath, content: readFileSync(absolutePath, "utf8") });
}

const configPath = join(root, "brutalise.config.json");
if (existsSync(configPath)) {
  files.push({ path: "brutalise.config.json", content: readFileSync(configPath, "utf8") });
}

await Bun.write("/tmp/brutalise-payload.json", JSON.stringify({ files }));
await Bun.write("/tmp/brutalise-count.txt", String(files.length));
