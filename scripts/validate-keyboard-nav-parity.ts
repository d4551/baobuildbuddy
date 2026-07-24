/**
 * Every sidebar NavigationItem must appear in KEYBOARD_ROUTE_SHORTCUTS
 * or declare keyboardOptional: true.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { reportViolations, type ValidationViolation } from "./utils/validation-helpers";

const NAV_FILE = "packages/client/constants/navigation.ts";
const SHORTCUT_FILE = "packages/client/composables/useKeyboardShortcuts.ts";
const KEYBOARD_OPTIONAL_PATTERN = /keyboardOptional:\s*true/u;

const NAV_ITEM_BLOCK_PATTERN =
  /\{\s*id:\s*"([^"]+)"[\s\S]*?includeInSidebar:\s*(true|false)([\s\S]*?)(?=\n\s*\{|\n\];)/gu;

export const collectKeyboardNavParityViolations = (input: {
  navigationSource: string;
  shortcutSource: string;
}): ValidationViolation[] => {
  const violations: ValidationViolation[] = [];
  const shortcutIds = new Set<string>();
  for (const match of input.shortcutSource.matchAll(/id:\s*"([^"]+)"/gu)) {
    const id = match[1];
    if (id) {
      shortcutIds.add(id);
    }
  }

  for (const match of input.navigationSource.matchAll(NAV_ITEM_BLOCK_PATTERN)) {
    const id = match[1] ?? "";
    const includeInSidebar = match[2] === "true";
    const rest = match[3] ?? "";
    if (!includeInSidebar || id.length === 0) {
      continue;
    }
    const optional = KEYBOARD_OPTIONAL_PATTERN.test(rest);
    if (!optional && !shortcutIds.has(id)) {
      violations.push({
        filePath: NAV_FILE,
        line: 1,
        message: `Sidebar nav "${id}" lacks KEYBOARD_ROUTE_SHORTCUTS entry and keyboardOptional`,
      });
    }
  }

  return violations;
};

const main = async (): Promise<void> => {
  const root = process.cwd();
  const [navigationSource, shortcutSource] = await Promise.all([
    readFile(join(root, NAV_FILE), "utf8"),
    readFile(join(root, SHORTCUT_FILE), "utf8"),
  ]);
  await reportViolations(
    "Keyboard nav parity validation failed:",
    collectKeyboardNavParityViolations({ navigationSource, shortcutSource }),
    "Keyboard nav parity validation passed.",
  );
};

if (import.meta.main) {
  await main();
}
