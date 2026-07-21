/**
 * ESLint softener gate — bans quality-rule demotions in client/root ESLint configs.
 *
 * Allowed "off" only:
 * - no-undef (TypeScript projectService owns globals)
 * - vue/multi-word-component-names on Nuxt pages/layouts/app/error only
 *
 * Layout/format rule mute-lists after flat/recommended are FORBIDDEN — use flat/essential
 * + explicit quality ratchets (Biome owns formatting).
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { reportViolations, type ValidationViolation } from "./utils/validation-helpers";

const CLIENT_ESLINT_PATH = "packages/client/eslint.config.js";
const ROOT_ESLINT_PATH = "eslint.config.mjs";

const ALLOWED_GLOBAL_OFF = new Set(["no-undef"]);
const ALLOWED_NUXT_PAGE_OFF = new Set(["vue/multi-word-component-names"]);

const RULE_OFF_PATTERN = /["']([^"']+)["']\s*:\s*["']off["']/gu;
const LAYOUT_MUTE_PATTERN =
  /vue\/(?:max-attributes-per-line|html-self-closing|singleline-html-element-content-newline|attributes-order|html-closing-bracket-spacing|first-attribute-linebreak|html-closing-bracket-newline)\s*["']?\s*:\s*["']off["']/u;
const NUXT_PAGES_GLOB_PATTERN = /pages\/\*\*\/\*\.vue/u;
const NUXT_LAYOUTS_GLOB_PATTERN = /layouts\/\*\*\/\*\.vue/u;

const collectOffRules = (content: string): string[] => {
  const found: string[] = [];
  for (const match of content.matchAll(RULE_OFF_PATTERN)) {
    const rule = match[1];
    if (rule) {
      found.push(rule);
    }
  }
  return found;
};

const hasNuxtPageOverride = (content: string): boolean =>
  NUXT_PAGES_GLOB_PATTERN.test(content) && NUXT_LAYOUTS_GLOB_PATTERN.test(content);

export const collectEslintSofteningViolationsForContent = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  const violations: ValidationViolation[] = [];
  if (LAYOUT_MUTE_PATTERN.test(content)) {
    violations.push({
      filePath,
      line: 1,
      message:
        "Vue layout/format rule muted with off — forbidden softener. Use flat/essential + quality ratchets; Biome formats.",
    });
  }
  if (content.includes("flat/recommended") && content.includes("html-self-closing")) {
    violations.push({
      filePath,
      line: 1,
      message:
        "flat/recommended + layout mute pattern detected — switch to flat/essential (no layout softens).",
    });
  }
  if (!content.includes("flat/essential") && filePath === CLIENT_ESLINT_PATH) {
    violations.push({
      filePath,
      line: 1,
      message:
        'Client ESLint must use pluginVue.configs["flat/essential"] (quality, no layout mute).',
    });
  }
  const offRules = collectOffRules(content);
  for (const rule of offRules) {
    if (ALLOWED_GLOBAL_OFF.has(rule)) {
      continue;
    }
    if (ALLOWED_NUXT_PAGE_OFF.has(rule) && hasNuxtPageOverride(content)) {
      continue;
    }
    violations.push({
      filePath,
      line: 1,
      message: `ESLint rule "${rule}" set to off — forbidden softener (allowlist: no-undef; multi-word on Nuxt pages only).`,
    });
  }
  if (content.includes(': "warn"') || content.includes(": 'warn'")) {
    violations.push({
      filePath,
      line: 1,
      message: 'ESLint severity "warn" is forbidden softener — use "error".',
    });
  }
  return violations;
};

const collectViolations = (): ValidationViolation[] => {
  const paths = [CLIENT_ESLINT_PATH, ROOT_ESLINT_PATH];
  return paths.flatMap((relativePath) => {
    const absolutePath = resolve(process.cwd(), relativePath);
    const content = readFileSync(absolutePath, "utf8");
    return collectEslintSofteningViolationsForContent(relativePath, content);
  });
};

if (import.meta.main) {
  await reportViolations(
    "ESLint softener validation failed:",
    collectViolations(),
    "ESLint softener validation passed.",
  );
}
