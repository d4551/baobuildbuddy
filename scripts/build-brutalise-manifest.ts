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
  for (const ent of await readdir(dir, { withFileTypes: true })) {
    if (ent.name.startsWith(".")) continue;
    const abs = join(dir, ent.name);
    const rel = abs.slice(ROOT.length + 1);
    if (ent.isDirectory()) {
      if (DENY_DIR.has(ent.name)) continue;
      await walk(abs, out);
      continue;
    }
    const dot = ent.name.lastIndexOf(".");
    const ext = dot >= 0 ? ent.name.slice(dot) : "";
    if (!ALLOW_EXT.has(ext)) continue;
    out.push(rel);
  }
  return out;
};

const paths = await walk(ROOT, []);
paths.sort();
const files = await Promise.all(
  paths.map(async (path) => ({
    path,
    content: await Bun.file(join(ROOT, path)).text(),
  })),
);

const governanceCandidates = ["bao-governance.json", "governance/bao-governance.json"];
const configCandidates = ["brutalise.config.json", "governance/brutalise.config.json"];
for (const candidate of [...governanceCandidates, ...configCandidates]) {
  const file = Bun.file(join(ROOT, candidate));
  if (await file.exists()) {
    files.push({ path: candidate, content: await file.text() });
  }
}

await Bun.write(OUT, JSON.stringify({ files }));
await Bun.write(
  join(ROOT, "docs/ssot-ledger/brutalise-manifest.meta.json"),
  JSON.stringify({ count: files.length, bytes: (await Bun.file(OUT).text()).length }),
);
