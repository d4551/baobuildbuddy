/**
 * Split BADGE_* / soft-action token imports from ~/constants/layout
 * onto layout-badges / layout-action-soft public SSOT modules (no barrel).
 */
import { readdir } from "node:fs/promises";
import { join } from "node:path";

const BADGE_TOKEN_RE = /^BADGE_[A-Z0-9_]+$/u;
const SOFT_TOKEN_RE = /^(SOFT_ACTION_CLASS|SECONDARY_ACTION_CLASS|SECONDARY_ACTION_DENSE_CLASS|ACCENT_ACTION_CLASS)$/u;

const walk = async (dir: string): Promise<string[]> => {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".nuxt" || entry.name === "dist") {
        continue;
      }
      out.push(...(await walk(path)));
      continue;
    }
    if (entry.name.endsWith(".vue") || entry.name.endsWith(".ts")) {
      out.push(path);
    }
  }
  return out;
};

const parseNamedImports = (block: string): string[] =>
  block
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.replace(/\s+/gu, " "));

const formatImport = (names: string[], from: string): string => {
  const sorted = [...names].sort((a, b) => a.localeCompare(b));
  return `import {\n  ${sorted.join(",\n  ")},\n} from "${from}";`;
};

const splitFile = (content: string): string => {
  const importRe = /import\s*\{([^}]*)\}\s*from\s*["']~\/constants\/layout["']\s*;?/gu;
  let next = content;
  const matches = [...content.matchAll(importRe)];
  if (matches.length === 0) {
    return content;
  }

  for (const match of matches) {
    const full = match[0] ?? "";
    const names = parseNamedImports(match[1] ?? "");
    const layoutNames: string[] = [];
    const badgeNames: string[] = [];
    const softNames: string[] = [];
    for (const name of names) {
      const base = name.split(" as ")[0]?.trim() ?? name;
      if (BADGE_TOKEN_RE.test(base)) {
        badgeNames.push(name);
        continue;
      }
      if (SOFT_TOKEN_RE.test(base)) {
        softNames.push(name);
        continue;
      }
      layoutNames.push(name);
    }
    const chunks: string[] = [];
    if (layoutNames.length > 0) {
      chunks.push(formatImport(layoutNames, "~/constants/layout"));
    }
    if (badgeNames.length > 0) {
      chunks.push(formatImport(badgeNames, "~/constants/layout-badges"));
    }
    if (softNames.length > 0) {
      chunks.push(formatImport(softNames, "~/constants/layout-action-soft"));
    }
    next = next.replace(full, chunks.join("\n"));
  }
  return next;
};

const log: string[] = [];
for (const file of await walk("packages/client")) {
  if (file.includes("/constants/layout")) {
    continue;
  }
  const original = await Bun.file(file).text();
  if (!original.includes('from "~/constants/layout"') && !original.includes("from '~/constants/layout'")) {
    continue;
  }
  if (!/BADGE_|SOFT_ACTION_CLASS|SECONDARY_ACTION_CLASS|ACCENT_ACTION_CLASS/u.test(original)) {
    continue;
  }
  const rewritten = splitFile(original);
  if (rewritten === original) {
    continue;
  }
  await Bun.write(file, rewritten);
  log.push(file);
}
await Bun.write("scripts/.tmp-split-badge-imports.txt", `${log.join("\n")}\ncount=${log.length}\n`);
