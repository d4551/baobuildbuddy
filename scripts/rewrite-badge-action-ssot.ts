/**
 * One-shot rewrite: raw badge / soft / accent / secondary button literals → layout tokens.
 */
import { readdir } from "node:fs/promises";
import { join } from "node:path";

const ROOT = "packages/client";
const LOG_PATH = "scripts/.tmp-badge-rewrite-log.txt";

const CLASS_REPLACEMENTS: Array<[string, string]> = [
  ["badge badge-warning badge-soft badge-sm", "BADGE_SOFT_WARNING_SM_CLASS"],
  ["badge badge-success badge-soft", "BADGE_SOFT_SUCCESS_CLASS"],
  ["badge badge-warning badge-soft", "BADGE_SOFT_WARNING_CLASS"],
  ["badge badge-primary badge-soft", "BADGE_SOFT_PRIMARY_CLASS"],
  ["badge badge-soft badge-primary", "BADGE_SOFT_PRIMARY_CLASS"],
  ["badge badge-soft badge-info", "BADGE_SOFT_INFO_CLASS"],
  ["badge badge-sm badge-soft", "BADGE_SOFT_SM_CLASS"],
  ["badge badge-soft badge-sm", "BADGE_SOFT_SM_CLASS"],
  ["badge badge-sm badge-ghost", "BADGE_GHOST_SM_CLASS"],
  ["badge badge-ghost badge-sm", "BADGE_GHOST_SM_CLASS"],
  ["badge badge-ghost badge-xs", "BADGE_GHOST_XS_CLASS"],
  ["badge badge-ghost", "BADGE_GHOST_CLASS"],
  ["badge badge-info badge-outline", "BADGE_INFO_OUTLINE_CLASS"],
  ["badge badge-outline badge-primary", "BADGE_PRIMARY_OUTLINE_CLASS"],
  ["badge badge-primary badge-outline", "BADGE_PRIMARY_OUTLINE_CLASS"],
  ["badge badge-secondary badge-outline", "BADGE_SECONDARY_OUTLINE_CLASS"],
  ["badge badge-outline border-current/20 text-current/80", "BADGE_OUTLINE_MUTED_CLASS"],
  ["badge badge-accent badge-lg border-0", "BADGE_ACCENT_LG_CLASS"],
  ["badge badge-outline badge-xs", "BADGE_OUTLINE_XS_CLASS"],
  ["badge badge-primary badge-xs", "BADGE_PRIMARY_XS_CLASS"],
  ["badge badge-warning badge-xs", "BADGE_WARNING_XS_CLASS"],
  ["badge badge-error badge-sm", "BADGE_ERROR_SM_CLASS"],
  ["badge badge-success badge-sm", "BADGE_SUCCESS_SM_CLASS"],
  ["badge badge-primary badge-sm", "BADGE_PRIMARY_SM_CLASS"],
  ["badge badge-neutral badge-sm", "BADGE_NEUTRAL_SM_CLASS"],
  ["badge badge-sm badge-outline", "BADGE_OUTLINE_SM_CLASS"],
  ["badge badge-outline", "BADGE_OUTLINE_CLASS"],
  ["badge badge-success", "BADGE_SUCCESS_CLASS"],
  ["badge badge-primary", "BADGE_PRIMARY_CLASS"],
  ["badge badge-secondary", "BADGE_SECONDARY_CLASS"],
  ["badge badge-neutral", "BADGE_NEUTRAL_CLASS"],
  ["badge badge-accent", "BADGE_ACCENT_CLASS"],
  ["badge badge-sm", "BADGE_SM_CLASS"],
  ["badge badge-lg", "BADGE_LG_CLASS"],
  ["badge badge-xs", "BADGE_XS_CLASS"],
  ["btn btn-accent border-0", "ACCENT_ACTION_CLASS"],
  ["btn btn-accent", "ACCENT_ACTION_CLASS"],
  ["btn btn-secondary btn-outline", "OUTLINE_ACTION_SECONDARY_CLASS"],
  ["btn btn-secondary btn-sm", "SECONDARY_ACTION_DENSE_CLASS"],
  ["btn btn-secondary", "SECONDARY_ACTION_CLASS"],
  ["btn btn-soft", "SOFT_ACTION_CLASS"],
];

const TOKEN_SET = new Set(CLASS_REPLACEMENTS.map(([, token]) => token));

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
    if (entry.name.endsWith(".vue")) {
      out.push(path);
    }
  }
  return out;
};

const ensureImport = (content: string, tokens: string[]): string => {
  if (tokens.length === 0) {
    return content;
  }
  const importRe = /import\s*\{([^}]*)\}\s*from\s*["']~\/constants\/layout["']\s*;?/u;
  const match = content.match(importRe);
  if (!match) {
    const scriptMatch = content.match(/<script setup(?:\s+lang="ts")?>\n/u);
    if (!scriptMatch || scriptMatch.index === undefined) {
      return content;
    }
    const insertAt = scriptMatch.index + scriptMatch[0].length;
    const sorted = [...tokens].sort((a, b) => a.localeCompare(b));
    const block = `import {\n  ${sorted.join(",\n  ")},\n} from "~/constants/layout";\n`;
    return content.slice(0, insertAt) + block + content.slice(insertAt);
  }
  const names = new Set(
    (match[1] ?? "")
      .split(",")
      .map((part) => part.trim().split(/\s+as\s+/u)[0]?.trim() ?? "")
      .filter(Boolean),
  );
  for (const token of tokens) {
    names.add(token);
  }
  const sorted = [...names].sort((a, b) => a.localeCompare(b));
  return content.replace(importRe, `import {\n  ${sorted.join(",\n  ")},\n} from "~/constants/layout";`);
};

const rewriteStaticClassAttr = (content: string): { content: string; tokens: string[] } => {
  const used = new Set<string>();
  const next = content.replace(/class="([^"]*)"/gu, (full, raw: string) => {
    for (const [literal, token] of CLASS_REPLACEMENTS) {
      if (raw.trim() === literal) {
        used.add(token);
        return `:class="[${token}]"`;
      }
      if (raw.includes(literal)) {
        const extra = raw.replace(literal, "").replace(/\s+/gu, " ").trim();
        used.add(token);
        if (extra.length === 0) {
          return `:class="[${token}]"`;
        }
        return `class="${extra}" :class="[${token}]"`;
      }
    }
    return full;
  });
  return { content: next, tokens: [...used] };
};

const logLines: string[] = [];
for (const file of await walk(ROOT)) {
  if (file.includes("/constants/")) {
    continue;
  }
  const original = await Bun.file(file).text();
  if (!/badge badge-|btn btn-(soft|secondary|accent)/u.test(original)) {
    continue;
  }
  const { content: rewritten, tokens } = rewriteStaticClassAttr(original);
  if (rewritten === original) {
    continue;
  }
  const withImport = ensureImport(
    rewritten,
    tokens.filter((token) => TOKEN_SET.has(token)),
  );
  await Bun.write(file, withImport);
  logLines.push(`${file} :: ${tokens.join(",")}`);
}
await Bun.write(LOG_PATH, `${logLines.join("\n")}\nchanged=${logLines.length}\n`);
