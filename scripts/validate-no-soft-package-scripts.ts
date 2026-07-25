/**
 * Ban soft `echo` success stubs for lint/typecheck in package.json scripts.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { reportViolations, type ValidationViolation } from "./utils/validation-helpers";

const PACKAGE_JSON_PATHS = [
  "package.json",
  "packages/client/package.json",
  "packages/server/package.json",
  "packages/shared/package.json",
  "packages/scraper/package.json",
  "packages/desktop/package.json",
] as const;

const SOFT_SCRIPT_PATTERN = /"(lint|typecheck)"\s*:\s*"echo\s+/u;

export const collectSoftPackageScriptViolations = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (!SOFT_SCRIPT_PATTERN.test(content)) {
    return [];
  }
  return [
    {
      filePath,
      line: 1,
      message:
        "Soft echo stub for lint/typecheck banned. Wire a real check (or cargo/script) — fake-green package scripts are SOFTENED.",
    },
  ];
};

const main = async (): Promise<void> => {
  const root = process.cwd();
  const groups = await Promise.all(
    PACKAGE_JSON_PATHS.map(async (relativePath) => {
      const content = await readFile(join(root, relativePath), "utf8");
      return collectSoftPackageScriptViolations(relativePath, content);
    }),
  );
  await reportViolations(
    "Soft package script validation failed:",
    groups.flat(),
    "Soft package script validation passed.",
  );
};

if (import.meta.main) {
  await main();
}
