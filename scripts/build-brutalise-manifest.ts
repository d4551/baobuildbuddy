import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const batches: Record<string, string[]> = {
  "client-components": ["packages/client/components"],
  "client-core": [
    "packages/client/composables",
    "packages/client/constants",
    "packages/client/pages",
    "packages/client/layouts",
    "packages/client/assets/css",
    "packages/client/utils",
  ],
  server: ["packages/server/src"],
  shared: ["packages/shared/src"],
};
const exts = new Set([".ts", ".vue", ".css"]);

const walk = (d: string, out: Array<{ path: string; content: string }>): void => {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    const s = statSync(p);
    if (s.isDirectory()) {
      walk(p, out);
    } else if (exts.has(p.slice(p.lastIndexOf(".")))) {
      out.push({ path: relative(root, p), content: readFileSync(p, "utf8") });
    }
  }
};

const writeTasks = Object.entries(batches).map(([name, dirs]) => {
  const files: Array<{ path: string; content: string }> = [];
  for (const d of dirs) {
    walk(join(root, d), files);
  }
  const json = JSON.stringify(files);
  process.stdout.write(`${name}: files=${files.length} bytes=${json.length}\n`);
  return Bun.write(`/tmp/brutalise-${name}.json`, json);
});
await Promise.all(writeTasks);
