/**
 * Rewrite high-frequency raw badge / soft / secondary button strings to SSOT tokens.
 * Longest-first; merges into :class arrays; never dual :class.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = join(process.cwd(), "packages/client");
const SKIP = new Set([
  "constants/layout-tokens.ts",
  "constants/layout.ts",
  "constants/layout-shell.ts",
  "constants/layout-badges.ts",
  "constants/layout-action-soft.ts",
]);

const walk = (dir: string, acc: string[] = []): string[] => {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === "node_modules" || name === ".nuxt" || name === "dist") continue;
      walk(full, acc);
      continue;
    }
    if (name.endsWith(".vue") || name.endsWith(".ts")) acc.push(full);
  }
  return acc;
};

const ensureImport = (content: string, symbols: readonly string[]): string => {
  const needed = symbols.filter((s) => content.includes(s));
  if (needed.length === 0) return content;
  const importMatch = content.match(
    /import\s*\{([^}]+)\}\s*from\s*["']~\/constants\/layout["']\s*;?/u,
  );
  if (importMatch) {
    const existing = importMatch[1]
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    const merged = [...new Set([...existing, ...needed])].sort();
    return content.replace(
      importMatch[0],
      `import {\n  ${merged.join(",\n  ")},\n} from "~/constants/layout";`,
    );
  }
  if (!content.includes("<script setup")) return content;
  const scriptIdx = content.indexOf("<script setup");
  const afterScript = content.indexOf("\n", scriptIdx) + 1;
  return (
    content.slice(0, afterScript) +
    `import {\n  ${[...new Set(needed)].sort().join(",\n  ")},\n} from "~/constants/layout";\n` +
    content.slice(afterScript)
  );
};

const REPLACEMENTS: ReadonlyArray<readonly [string, string]> = [
  ["badge badge-soft badge-info badge-xs", "BADGE_SOFT_INFO_XS_CLASS"],
  ["badge badge-soft badge-primary badge-xs", "BADGE_SOFT_PRIMARY_XS_CLASS"],
  ["badge badge-soft badge-info", "BADGE_SOFT_INFO_CLASS"],
  ["badge badge-soft badge-primary", "BADGE_SOFT_PRIMARY_CLASS"],
  ["badge badge-soft badge-sm", "BADGE_SOFT_SM_CLASS"],
  ["badge badge-warning badge-soft", "BADGE_SOFT_WARNING_CLASS"],
  ["badge badge-neutral badge-soft", "BADGE_SOFT_NEUTRAL_CLASS"],
  ["badge-warning badge-soft", "BADGE_SOFT_WARNING_CLASS"],
  ["badge-neutral badge-soft", "BADGE_SOFT_NEUTRAL_CLASS"],
  ["badge badge-ghost badge-xs", "BADGE_GHOST_XS_CLASS"],
  ["badge badge-ghost badge-sm", "BADGE_GHOST_SM_CLASS"],
  ["badge badge-ghost", "BADGE_GHOST_CLASS"],
  ["badge badge-success badge-sm", "BADGE_SUCCESS_SM_CLASS"],
  ["badge badge-primary badge-sm", "BADGE_PRIMARY_SM_CLASS"],
  ["badge badge-primary badge-outline", "BADGE_PRIMARY_OUTLINE_CLASS"],
  ["badge badge-lg badge-primary", "BADGE_PRIMARY_LG_CLASS"],
  ["badge badge-primary badge-lg", "BADGE_PRIMARY_LG_CLASS"],
  ["badge badge-primary", "BADGE_PRIMARY_CLASS"],
  ["badge badge-success", "BADGE_SUCCESS_CLASS"],
  ["badge badge-sm badge-outline", "BADGE_OUTLINE_SM_CLASS"],
  ["badge badge-outline badge-sm", "BADGE_OUTLINE_SM_CLASS"],
  ["badge badge-outline", "BADGE_OUTLINE_CLASS"],
  ["badge badge-neutral badge-sm", "BADGE_NEUTRAL_SM_CLASS"],
  ["badge badge-sm", "BADGE_SM_CLASS"],
  ["badge badge-lg", "BADGE_LG_CLASS"],
  ["btn btn-secondary btn-sm", "SECONDARY_ACTION_DENSE_CLASS"],
  ["btn btn-secondary", "SECONDARY_ACTION_CLASS"],
  ["btn btn-soft", "SOFT_ACTION_CLASS"],
  ["btn btn-accent border-0", "ACCENT_ACTION_CLASS"],
];

let changed = 0;
for (const file of walk(ROOT)) {
  const rel = relative(ROOT, file);
  if (SKIP.has(rel)) continue;
  let content = readFileSync(file, "utf8");
  const original = content;
  const used = new Set<string>();

  for (const [literal, token] of REPLACEMENTS) {
    if (!content.includes(literal)) continue;
    used.add(token);
    content = content.replaceAll(`class="${literal}"`, `:class="[${token}]"`);
    content = content.replaceAll(`class='${literal}'`, `:class="[${token}]"`);
    content = content.replaceAll(`'${literal}'`, token);
    content = content.replaceAll(`"${literal}"`, token);
  }

  // Merge dual :class on one line
  content = content.replace(
    /:class="(\[[^\]]+\])"\s+:class="(\[[^\]]+\])"/gu,
    (_m, a: string, b: string) => {
      const ia = a.slice(1, -1).trim().replace(/,\s*$/u, "");
      const ib = b.slice(1, -1).trim().replace(/^,\s*/u, "");
      return `:class="[${ia}, ${ib}]"`;
    },
  );

  if (content === original) continue;
  content = ensureImport(content, [...used]);
  writeFileSync(file, content);
  changed += 1;
}

writeFileSync(
  join(process.cwd(), "docs/ssot-ledger/badge-soft-rewrite-count.txt"),
  `files_changed=${String(changed)}\n`,
);
