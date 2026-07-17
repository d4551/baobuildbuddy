/**
 * Convert baobox Type/StandardSchemaV1/StaticParse usage to Elysia `t` / Static.
 * Usage: bun run scripts/codemod-baobox-to-elysia-t.ts [--write]
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const WRITE = process.argv.includes("--write");
const ROOT = join(import.meta.dir, "..");
const SCAN_ROOT = join(ROOT, "packages/server/src");

function collectTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === "dist" || entry === "dist-types" || entry === "node_modules") continue;
      out.push(...collectTsFiles(full));
      continue;
    }
    if (entry.endsWith(".ts") && !entry.endsWith(".d.ts")) out.push(full);
  }
  return out;
}

function transform(source: string): string {
  let text = source;
  if (!text.includes("baobox") && !text.includes("StandardSchemaV1") && !/\bType\./.test(text)) {
    return text;
  }

  // Unwrap StandardSchemaV1(...)
  text = text.replace(/\bStandardSchemaV1\s*\(/g, "(");

  // Replace StaticParse type imports/usages
  text = text.replace(/\bStaticParse\b/g, "Static");

  // Replace Type. with t.
  text = text.replace(/\bType\./g, "t.");

  // Normalize import lines from baobox
  text = text.replace(
    /import\s+Type\s*,\s*\{\s*([^}]*)\}\s*from\s*"baobox";/g,
    (_m, inner: string) => {
      const names = inner
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean)
        .filter((part) => !part.includes("StandardSchemaV1") && !part.includes("StaticParse"));
      const hasStatic = names.some((n) => n === "Static" || n.endsWith(" Static"));
      const staticPart = hasStatic ? "" : "type Static, ";
      return `import { ${staticPart}t } from "elysia";`;
    },
  );

  text = text.replace(/import\s+\{\s*([^}]*)\}\s*from\s*"baobox";/g, (_m, inner: string) => {
    const names = inner
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .filter((part) => !part.includes("StandardSchemaV1") && !part.includes("StaticParse"));
    if (names.length === 0) {
      return `import { type Static, t } from "elysia";`;
    }
    const hasStatic = names.some((n) => n === "Static" || n.includes("Static"));
    const staticPart = hasStatic ? names.join(", ") : `type Static, ${names.join(", ")}`;
    // If only leftover junk, just t
    if (staticPart.replace(/type Static,?/, "").trim().length === 0) {
      return `import { type Static, t } from "elysia";`;
    }
    return `import { ${staticPart.includes("t") ? staticPart : `${staticPart}, t`} } from "elysia";`;
  });

  text = text.replace(/import\s+Type\s+from\s*"baobox";/g, `import { t } from "elysia";`);

  // Clean double elysia imports by leaving as-is for now; biome/eslint can merge later.
  // Replace Unknown via t.Unknown already from Type.Unknown → t.Unknown

  // Remove empty paren wrappers left as ((schema)) → (schema) iteratively
  for (let i = 0; i < 3; i += 1) {
    text = text.replace(/\(\(([^()]+)\)\)/g, "($1)");
  }

  // Fix `import { type Static, t } from "elysia"` duplicated if file already imported Elysia
  // Merge: `import { Elysia } from "elysia";\nimport { type Static, t } from "elysia";`
  text = text.replace(
    /import\s+\{\s*Elysia\s*\}\s*from\s*"elysia";\s*\nimport\s+\{\s*type Static,\s*t\s*\}\s*from\s*"elysia";/g,
    `import { Elysia, type Static, t } from "elysia";`,
  );
  text = text.replace(
    /import\s+\{\s*Elysia,\s*setupTypebox\s*\}\s*from\s*"elysia";\s*\nimport\s+\{\s*type Static,\s*t\s*\}\s*from\s*"elysia";/g,
    `import { Elysia, setupTypebox, type Static, t } from "elysia";`,
  );

  // app.ts style: import Type, StandardSchemaV1 already handled; ensure setupTypebox + t
  if (text.includes('from "elysia"') && text.includes("t.") && !/\bt\b/.test(text.split("from \"elysia\"")[0] ?? "")) {
    // t used but not imported — rare after replacements
  }

  return text;
}

let filesChanged = 0;
const changed: string[] = [];

for (const file of collectTsFiles(SCAN_ROOT)) {
  const original = readFileSync(file, "utf8");
  if (!original.includes("baobox") && !original.includes("StandardSchemaV1")) continue;
  const next = transform(original);
  if (next === original) continue;
  filesChanged += 1;
  changed.push(relative(ROOT, file));
  if (WRITE) writeFileSync(file, next);
}

console.log(JSON.stringify({ write: WRITE, filesChanged, files: changed }, null, 2));
