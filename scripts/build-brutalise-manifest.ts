import { readdir } from "node:fs/promises";
import { join } from "node:path";

const ROOT = process.cwd();
const OUT = join(ROOT, "docs/ssot-ledger/brutalise-manifest.json");
const ALLOW_EXT = new Set([".ts", ".tsx", ".vue", ".css", ".mjs", ".js", ".html"]);
const DENY_DIR = new Set([
  "node_modules",
  ".git",
  ".nuxt",
  ".output",
  "dist",
  "dist-types",
  "coverage",
  "releases",
  "ssot-ledger",
]);

const walk = async (dir: string, out: string[]): Promise<string[]> => {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (ent) => {
      if (ent.name.startsWith(".")) return [] as string[];
      const abs = join(dir, ent.name);
      const rel = abs.slice(ROOT.length + 1);
      if (ent.isDirectory()) {
        if (DENY_DIR.has(ent.name)) return [] as string[];
        return walk(abs, []);
      }
      const dot = ent.name.lastIndexOf(".");
      const ext = dot >= 0 ? ent.name.slice(dot) : "";
      if (!ALLOW_EXT.has(ext)) return [] as string[];
      return [rel];
    }),
  );
  for (const batch of nested) {
    out.push(...batch);
  }
  return out;
};

const paths = (await walk(ROOT, [])).sort();
const files = await Promise.all(
  paths.map(async (path) => ({
    path,
    content: await Bun.file(join(ROOT, path)).text(),
  })),
);

const metaCandidates = [
  "bao-governance.json",
  "governance/bao-governance.json",
  "brutalise.config.json",
  "governance/brutalise.config.json",
];
const metaFiles = (
  await Promise.all(
    metaCandidates.map(async (candidate) => {
      const file = Bun.file(join(ROOT, candidate));
      if (!(await file.exists())) return null;
      return { path: candidate, content: await file.text() };
    }),
  )
).filter((entry): entry is { path: string; content: string } => entry !== null);

files.push(...metaFiles);

await Bun.write(OUT, JSON.stringify({ files }));
await Bun.write(
  join(ROOT, "docs/ssot-ledger/brutalise-manifest.meta.json"),
  JSON.stringify({ count: files.length, bytes: (await Bun.file(OUT).text()).length }),
);
