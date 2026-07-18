#!/usr/bin/env bun
/**
 * Bulk SSOT token replacement script.
 * Reads all Vue files and replaces common inline patterns with SSOT imports.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, relative, join } from "node:path";

const CLIENT_ROOT = resolve(import.meta.dirname, "../packages/client");
const SRC_DIRS = ["pages", "components", "layouts", "composables"];

// Pattern → [importName, replacementValue] mapping
const SVG_STROKE_FIX = ['stroke-width="2"', ':stroke-width="ICON_DECORATIVE_STROKE_WIDTH"'];

// Common icon size replacements (class="h-X w-X" → :class="ICON_SIZE_CLASS['X']")
const ICON_SIZE_MAP: Record<string, string> = {
  'class="h-3 w-3"': ':class="ICON_SIZE_CLASS.xs"',
  'class="h-4 w-4"': `:class="ICON_SIZE_CLASS['4']"`,
  'class="h-5 w-5"': ':class="ICON_SIZE_CLASS.sm"',
  'class="h-6 w-6"': ':class="ICON_SIZE_CLASS.md"',
  'class="h-8 w-8"': ':class="ICON_SIZE_CLASS.lg"',
  'class="h-12 w-12"': `:class="ICON_SIZE_CLASS['12']"`,
  'class="h-14 w-14"': `:class="ICON_SIZE_CLASS['14']"`,
  'class="h-20 w-20"': `:class="ICON_SIZE_CLASS['20']"`,
};

// Single-dimension replacements
const SINGLE_REPLACEMENTS: [RegExp, string][] = [
  // Gap
  [/\bclass="gap-1\b/g, ':class="FLEX_GAP_TOKEN_CLASS.gap1"'],
  [/\bclass="gap-6\b/g, ':class="FLEX_GAP_TOKEN_CLASS.gap6"'],
  // Space-y
  [/\bclass="space-y-1\b/g, ':class="STACK_SPACE_Y_TOKEN_CLASS.stack1"'],
  [/\bclass="space-y-5\b/g, ':class="STACK_SPACE_Y_TOKEN_CLASS.stack5"'],
  // Padding
  [/\bclass="p-6\b/g, ':class="PADDING_TOKEN_CLASS.p6"'],
  [/\bclass="p-8\b/g, ':class="PADDING_TOKEN_CLASS.p8"'],
  [/\bclass="px-4\b/g, ':class="PADDING_TOKEN_CLASS.px4"'],
  [/\bclass="px-6\b/g, ':class="PADDING_TOKEN_CLASS.px6"'],
  [/\bclass="py-0\b/g, ':class="PADDING_TOKEN_CLASS.py0"'],
  [/\bclass="py-2\b/g, ':class="PADDING_TOKEN_CLASS.py2"'],
  [/\bclass="py-4\b/g, ':class="PADDING_TOKEN_CLASS.py4"'],
  [/\bclass="py-5\b/g, ':class="PADDING_TOKEN_CLASS.py5"'],
  [/\bclass="py-8\b/g, ':class="PADDING_TOKEN_CLASS.py8"'],
  [/\bclass="pt-4\b/g, ':class="PADDING_TOKEN_CLASS.pt4"'],
  [/\bclass="pr-10\b/g, ':class="PADDING_TOKEN_CLASS.pr10"'],
  // Margin
  [/\bclass="mb-2\b/g, ':class="MARGIN_TOKEN_CLASS.mb2"'],
  [/\bclass="mb-3\b/g, ':class="MARGIN_TOKEN_CLASS.mb3"'],
  [/\bclass="mb-6\b/g, ':class="MARGIN_TOKEN_CLASS.mb6"'],
  [/\bclass="mb-8\b/g, ':class="MARGIN_TOKEN_CLASS.mb8"'],
  [/\bclass="mt-3\b/g, ':class="MARGIN_TOKEN_CLASS.mt3"'],
  [/\bclass="mt-6\b/g, ':class="MARGIN_TOKEN_CLASS.mt6"'],
  // Typography
  [/\bclass="text-xl\b/g, ':class="TYPOGRAPHY_SCALE_CLASS.xl"'],
  [/\bclass="text-4xl\b/g, ':class="TYPOGRAPHY_SCALE_CLASS.xl4"'],
  [/\bclass="text-6xl\b/g, ':class="TYPOGRAPHY_SCALE_CLASS.xl6"'],
  // Min-height/dimensions
  [/\bclass="min-h-0\b/g, ':class="MIN_HEIGHT_ZERO_CLASS"'],
  [/\bclass="min-h-24\b/g, ':class="MIN_HEIGHT_CHAT_CLASS"'],
  [/\bclass="min-h-28\b/g, ':class="MIN_HEIGHT_CONTENT_CLASS"'],
  [/\bclass="min-h-40\b/g, ':class="MIN_HEIGHT_SCROLL_CLASS"'],
  [/\bclass="min-h-48\b/g, ':class="HEIGHT_48_CLASS"'],
  [/\bclass="min-h-64\b/g, ':class="MIN_HEIGHT_EDITOR_CLASS"'],
  [/\bclass="h-48\b/g, ':class="HEIGHT_48_CLASS"'],
  [/\bclass="h-96\b/g, ':class="HEIGHT_96_CLASS"'],
  [/\bclass="w-20\b/g, ":class=\"ICON_SIZE_CLASS['20']\""],
  [/\bclass="w-80\b/g, ':class="SIDEBAR_WIDE_WIDTH_CLASS"'],
  // Max-width
  [/\bclass="max-w-md\b/g, ':class="AUTH_CARD_MAX_WIDTH_CLASS"'],
  [/\bclass="max-w-lg\b/g, ':class="ERROR_PAGE_MAX_WIDTH_CLASS"'],
];

// "mt-0.5 h-5 w-5" → split into static + dynamic
const COMPLEX_ICON_REPLACEMENTS: [RegExp, string][] = [
  [/\bclass="mt-0\.5 h-5 w-5 /g, 'class=":class="[MARGIN_TOKEN_CLASS.mt0, ICON_SIZE_CLASS.sm]" '],
  [/\bclass="h-5 w-5 text-primary\b/g, 'class="text-primary" :class="ICON_SIZE_CLASS.sm"'],
  [/\bclass="h-6 w-6 shrink-0\b/g, 'class="shrink-0" :class="ICON_SIZE_CLASS.md"'],
  [/\bclass="h-4 w-4 text-primary\b/g, 'class="text-primary" :class="ICON_SIZE_CLASS[\'4\']"'],
];

function collectVueFiles(dir: string): string[] {
  const files: string[] = [];
  try {
    for (const entry of [...Bun.readdirSync(dir)].map((name) => ({
      name,
      path: join(dir, name),
    }))) {
      const stat = Bun.statSync(entry.path);
      if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".nuxt")
        continue;
      if (stat.isDirectory()) {
        files.push(...collectVueFiles(entry.path));
      } else if (entry.name.endsWith(".vue")) {
        files.push(entry.path);
      }
    }
  } catch {}
  return files;
}

function getMissingImports(content: string): string[] {
  const needed: string[] = [];
  const importLine = content.match(/import\s*\{([^}]+)\}\s*from\s*"~\/constants\/layout"/);
  const existing = importLine ? importLine[1].split(",").map((s) => s.trim()) : [];

  const tokenMap: Record<string, string> = {
    FLEX_GAP_TOKEN_CLASS: "FLEX_GAP_TOKEN_CLASS",
    STACK_SPACE_Y_TOKEN_CLASS: "STACK_SPACE_Y_TOKEN_CLASS",
    PADDING_TOKEN_CLASS: "PADDING_TOKEN_CLASS",
    MARGIN_TOKEN_CLASS: "MARGIN_TOKEN_CLASS",
    ICON_DECORATIVE_STROKE_WIDTH: "ICON_DECORATIVE_STROKE_WIDTH",
    ICON_SIZE_CLASS: "ICON_SIZE_CLASS",
    TYPOGRAPHY_SCALE_CLASS: "TYPOGRAPHY_SCALE_CLASS",
    MIN_HEIGHT_ZERO_CLASS: "MIN_HEIGHT_ZERO_CLASS",
    MIN_HEIGHT_SCROLL_CLASS: "MIN_HEIGHT_SCROLL_CLASS",
    MIN_HEIGHT_EDITOR_CLASS: "MIN_HEIGHT_EDITOR_CLASS",
    MIN_HEIGHT_CHAT_CLASS: "MIN_HEIGHT_CHAT_CLASS",
    MIN_HEIGHT_CONTENT_CLASS: "MIN_HEIGHT_CONTENT_CLASS",
    MIN_HEIGHT_48_CLASS: "HEIGHT_48_CLASS",
    H_96_CLASS: "HEIGHT_96_CLASS",
    SIDEBAR_WIDE_WIDTH_CLASS: "SIDEBAR_WIDE_WIDTH_CLASS",
    AUTH_CARD_MAX_WIDTH_CLASS: "AUTH_CARD_MAX_WIDTH_CLASS",
    ERROR_PAGE_MAX_WIDTH_CLASS: "ERROR_PAGE_MAX_WIDTH_CLASS",
  };

  for (const [key, val] of Object.entries(tokenMap)) {
    if (content.includes(key) && !existing.includes(key)) {
      needed.push(key);
    }
  }
  return needed;
}

function addImportsToFile(content: string, needed: string[]): string {
  if (needed.length === 0) return content;

  const importRegex = /import\s*\{([^}]+)\}\s*from\s*"~\/constants\/layout"/;
  const match = content.match(importRegex);

  if (match) {
    const existing = match[1]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const allImports = [...new Set([...existing, ...needed])].sort();
    return content.replace(
      importRegex,
      `import { ${allImports.join(", ")} } from "~/constants/layout"`,
    );
  } else {
    // Add new import after the last existing import
    const lastImportIdx = content.lastIndexOf("import ");
    if (lastImportIdx >= 0) {
      const endOfLine = content.indexOf("\n", lastImportIdx);
      const sortedNeeded = [...needed].sort();
      return (
        content.slice(0, endOfLine + 1) +
        `\nimport { ${sortedNeeded.join(", ")} } from "~/constants/layout";` +
        content.slice(endOfLine + 1)
      );
    }
  }
  return content;
}

async function fixFile(absPath: string): Promise<boolean> {
  let content = readFileSync(absPath, "utf8");
  let modified = false;

  // Skip files that already import from constants/layout
  const hasLayoutImport = content.includes("~/constants/layout");

  // Replace stroke-width
  if (content.includes('stroke-width="2"')) {
    content = content.replace(/stroke-width="2"/g, ':stroke-width="ICON_DECORATIVE_STROKE_WIDTH"');
    modified = true;
  }

  // Replace icon sizes
  for (const [old, newVal] of Object.entries(ICON_SIZE_MAP)) {
    if (content.includes(old)) {
      content = content.replaceAll(old, newVal);
      modified = true;
    }
  }

  // Replace single patterns
  for (const [regex, replacement] of SINGLE_REPLACEMENTS) {
    if (regex.test(content)) {
      content = content.replaceAll(regex, replacement);
      modified = true;
    }
  }

  // Replace complex icon patterns
  for (const [regex, replacement] of COMPLEX_ICON_REPLACEMENTS) {
    if (regex.test(content)) {
      content = content.replaceAll(regex, replacement);
      modified = true;
    }
  }

  // Fix: h-5 w-5 fill-current → ICON_SIZE_CLASS.sm fill-current
  content = content.replace(
    /\bclass="h-5 w-5 fill-current"/g,
    'class="fill-current" :class="ICON_SIZE_CLASS.sm"',
  );
  content = content.replace(
    /\bclass="h-6 w-6 fill-current"/g,
    'class="fill-current" :class="ICON_SIZE_CLASS.md"',
  );
  content = content.replace(
    /\bclass="h-4 w-4 fill-current"/g,
    'class="fill-current" :class="ICON_SIZE_CLASS[\'4\']"',
  );

  // Fix: px-4 py-3 together in stat divs
  content = content.replace(
    /\bclass="stat px-4 py-3"/g,
    'class="stat" :class="[PADDING_TOKEN_CLASS.px4, PADDING_TOKEN_CLASS.py3]"',
  );

  // Fix: card-body gap-6
  content = content.replace(
    /\bclass="card-body gap-6"/g,
    'class="card-body" :class="FLEX_GAP_TOKEN_CLASS.gap6"',
  );

  // Fix: card-body space-y-1
  content = content.replace(
    /\bclass="card-body space-y-1"/g,
    'class="card-body" :class="STACK_SPACE_Y_TOKEN_CLASS.stack1"',
  );

  // Fix: badge gap-1 px-3 py-2 → badge + dynamic classes
  content = content.replace(
    /\bclass="badge badge-outline px-3 py-3"/g,
    'class="badge badge-outline" :class="[PADDING_TOKEN_CLASS.px3, PADDING_TOKEN_CLASS.py3]"',
  );

  // Add missing imports
  if (modified) {
    const needed = getMissingImports(content);
    if (needed.length > 0) {
      content = addImportsToFile(content, needed);
    }
    writeFileSync(absPath, content);
  }

  return modified;
}

async function main() {
  const allFiles: string[] = [];
  for (const dir of SRC_DIRS) {
    allFiles.push(...collectVueFiles(join(CLIENT_ROOT, dir)));
  }

  console.log(`Found ${allFiles.length} Vue files to process`);
  let fixed = 0;

  for (const file of allFiles) {
    if (await fixFile(file)) {
      fixed++;
      console.log(`  Fixed: ${relative(CLIENT_ROOT, file)}`);
    }
  }

  console.log(`\nFixed ${fixed} files.`);
}

await main();
