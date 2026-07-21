import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(process.cwd(), "packages/client");

const walk = (dir: string, acc: string[] = []): string[] => {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === "node_modules" || name === ".nuxt" || name === "dist") continue;
      walk(full, acc);
      continue;
    }
    if (name.endsWith(".vue")) acc.push(full);
  }
  return acc;
};

let changed = 0;
for (const file of walk(ROOT)) {
  let content = readFileSync(file, "utf8");
  const original = content;

  // [token] + function/binding on same line
  content = content.replace(
    /:class="\[([^\]]+)\]"\s+:class="([^"]+)"/gu,
    (_m, inner: string, second: string) => {
      const a = inner.trim().replace(/,\s*$/u, "");
      const b = second.trim();
      if (b.startsWith("[")) {
        const bi = b.slice(1, -1).trim();
        return `:class="[${a}, ${bi}]"`;
      }
      return `:class="[${a}, ${b}]"`;
    },
  );

  // multiline [token] then :class=
  content = content.replace(
    /:class="\[([^\]]+)\]"\s*\n(\s*):class="([^"]+)"/gu,
    (_m, inner: string, _indent: string, second: string) => {
      const a = inner.trim().replace(/,\s*$/u, "");
      const b = second.trim();
      if (b.startsWith("[")) {
        const bi = b.slice(1, -1).trim();
        return `:class="[${a}, ${bi}]"`;
      }
      return `:class="[${a}, ${b}]"`;
    },
  );

  if (content !== original) {
    writeFileSync(file, content);
    changed += 1;
  }
}
writeFileSync(
  join(process.cwd(), "docs/ssot-ledger/merge-dual-class-v2.txt"),
  `files_changed=${String(changed)}\n`,
);
