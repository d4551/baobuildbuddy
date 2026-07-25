/**
 * Desktop package gate: Tauri sources present; no soft echo scripts (companion to
 * validate-no-soft-package-scripts).
 */
import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import { reportViolations, type ValidationViolation } from "./utils/validation-helpers";

const DESKTOP_PACKAGE = "packages/desktop/package.json";
const SOFT_LINT_SCRIPT_PATTERN = /"lint"\s*:\s*"echo\s+/u;
const SOFT_TYPECHECK_SCRIPT_PATTERN = /"typecheck"\s*:\s*"echo\s+/u;
const CARGO_TOML = "packages/desktop/src-tauri/Cargo.toml";
const TAURI_CONF_CANDIDATES = [
  "packages/desktop/src-tauri/tauri.conf.json",
  "packages/desktop/src-tauri/tauri.conf.json5",
] as const;

const fileExists = async (relativePath: string): Promise<boolean> => {
  const settled = await access(join(process.cwd(), relativePath)).then(
    () => true,
    () => false,
  );
  return settled;
};

export const collectDesktopPackageViolations = async (): Promise<ValidationViolation[]> => {
  const violations: ValidationViolation[] = [];
  const packageJson = await readFile(join(process.cwd(), DESKTOP_PACKAGE), "utf8");
  if (
    SOFT_LINT_SCRIPT_PATTERN.test(packageJson) ||
    SOFT_TYPECHECK_SCRIPT_PATTERN.test(packageJson)
  ) {
    violations.push({
      filePath: DESKTOP_PACKAGE,
      line: 1,
      message: "desktop package.json must not use echo soft stubs for lint/typecheck",
    });
  }

  if (!(await fileExists(CARGO_TOML))) {
    violations.push({
      filePath: CARGO_TOML,
      line: 1,
      message: "missing src-tauri/Cargo.toml — desktop shell incomplete",
    });
  }

  const hasTauriConf = (
    await Promise.all(TAURI_CONF_CANDIDATES.map((candidate) => fileExists(candidate)))
  ).some(Boolean);
  if (!hasTauriConf) {
    violations.push({
      filePath: "packages/desktop/src-tauri",
      line: 1,
      message: "missing tauri.conf.json(5) under src-tauri",
    });
  }

  return violations;
};

const main = async (): Promise<void> => {
  await reportViolations(
    "Desktop package validation failed:",
    await collectDesktopPackageViolations(),
    "Desktop package validation passed.",
  );
};

if (import.meta.main) {
  await main();
}
