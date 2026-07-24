/**
 * Enforce STACK-CONTRACT CSS entry: Vite/postcss-import must resolve the
 * package style export (`tailwindcss/index.css`), not bare `"tailwindcss"`
 * (resolves as packages/client/tailwindcss → ENOENT in production builds).
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { reportViolations, type ValidationViolation } from "./utils/validation-helpers";

const MAIN_CSS = "packages/client/assets/css/main.css";
const REQUIRED_IMPORT = '@import "tailwindcss/index.css"';
const BANNED_BARE_IMPORT = '@import "tailwindcss"';

export const collectTailwindCssImportViolations = (content: string): ValidationViolation[] => {
  const violations: ValidationViolation[] = [];
  if (!content.includes(REQUIRED_IMPORT)) {
    violations.push({
      filePath: MAIN_CSS,
      line: 1,
      message: `Missing required ${REQUIRED_IMPORT} (STACK-CONTRACT Vite/postcss resolution bar).`,
    });
  }
  if (content.includes(BANNED_BARE_IMPORT)) {
    violations.push({
      filePath: MAIN_CSS,
      line: 1,
      message: `Bare ${BANNED_BARE_IMPORT} is banned — use ${REQUIRED_IMPORT}.`,
    });
  }
  return violations;
};

const main = async (): Promise<void> => {
  const content = await readFile(join(process.cwd(), MAIN_CSS), "utf8");
  await reportViolations(
    "Tailwind CSS import validation failed:",
    collectTailwindCssImportViolations(content),
    "Tailwind CSS import validation passed.",
  );
};

if (import.meta.main) {
  await main();
}
