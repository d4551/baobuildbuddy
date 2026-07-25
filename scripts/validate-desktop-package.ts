/**
 * Desktop package gate: Tauri sources present + `cargo check` (no echo soft stubs).
 */
import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import { reportViolations, type ValidationViolation } from "./utils/validation-helpers";

const DESKTOP_PACKAGE = "packages/desktop/package.json";
const SOFT_LINT_SCRIPT_PATTERN = /"lint"\s*:\s*"echo\s+/u;
const SOFT_TYPECHECK_SCRIPT_PATTERN = /"typecheck"\s*:\s*"echo\s+/u;
const CARGO_TOML = "packages/desktop/src-tauri/Cargo.toml";
const TAURI_SRC = "packages/desktop/src-tauri/src";
const MAIN_RS = "packages/desktop/src-tauri/src/main.rs";
const TAURI_CONF_CANDIDATES = [
  "packages/desktop/src-tauri/tauri.conf.json",
  "packages/desktop/src-tauri/tauri.conf.json5",
] as const;
const MOD_DECL_PATTERN = /^\s*(?:pub\s+)?mod\s+([A-Za-z0-9_]+)\s*;/gmu;
const CARGO_ERROR_DETAIL_MAX_CHARS = 6000;
const CARGO_ERROR_LINE_PATTERN = /\berror\b|failed to|cannot find|not found|Package /i;

export const trimCargoFailureDetail = (combined: string): string => {
  const trimmed = combined.trim();
  // Prefer rustc/pkg-config lines even when the blob is short — downloads must not bury the cause.
  const errorLines = trimmed.split("\n").filter((line) => CARGO_ERROR_LINE_PATTERN.test(line));
  if (errorLines.length > 0) {
    const focused = errorLines.join("\n");
    if (focused.length <= CARGO_ERROR_DETAIL_MAX_CHARS) {
      return focused;
    }
    return focused.slice(-CARGO_ERROR_DETAIL_MAX_CHARS);
  }
  if (trimmed.length <= CARGO_ERROR_DETAIL_MAX_CHARS) {
    return trimmed;
  }
  return trimmed.slice(-CARGO_ERROR_DETAIL_MAX_CHARS);
};

const fileExists = async (relativePath: string): Promise<boolean> => {
  const settled = await access(join(process.cwd(), relativePath)).then(
    () => true,
    () => false,
  );
  return settled;
};

const collectMissingModSources = async (): Promise<ValidationViolation[]> => {
  if (!(await fileExists(MAIN_RS))) {
    return [
      {
        filePath: MAIN_RS,
        line: 1,
        message: "missing src-tauri/src/main.rs",
      },
    ];
  }
  const mainSource = await readFile(join(process.cwd(), MAIN_RS), "utf8");
  const declaredMods = [...mainSource.matchAll(MOD_DECL_PATTERN)]
    .map((match) => match[1] ?? "")
    .filter((modName) => modName.length > 0);
  const existence = await Promise.all(
    declaredMods.map(async (modName) => {
      const modPath = `${TAURI_SRC}/${modName}.rs`;
      return { modName, modPath, exists: await fileExists(modPath) };
    }),
  );
  return existence
    .filter((entry) => !entry.exists)
    .map((entry) => ({
      filePath: MAIN_RS,
      line: 1,
      message: `main.rs declares mod ${entry.modName} but ${entry.modPath} is missing`,
    }));
};

const ensureTauriRuntimeResourceStub = async (): Promise<void> => {
  // tauri-build requires bundle.resources gen/runtime to exist for `cargo check`.
  // Full runtime packaging is prepare-desktop-runtime.ts; stub is compile-only.
  const runtimeDir = join(process.cwd(), "packages/desktop/src-tauri/gen/runtime");
  const manifestPath = join(runtimeDir, "manifest.json");
  await Bun.write(join(runtimeDir, ".gitkeep"), "");
  if (!(await Bun.file(manifestPath).exists())) {
    await Bun.write(manifestPath, `${JSON.stringify({ version: "0.1.0", stub: true })}\n`);
  }
};

const runCargoCheck = async (): Promise<ValidationViolation[]> => {
  if (!(await fileExists(CARGO_TOML))) {
    return [];
  }
  await ensureTauriRuntimeResourceStub();
  const cargoBin = (process.env.CARGO ?? "cargo").trim() || "cargo";
  const proc = Bun.spawn([cargoBin, "check", "--manifest-path", CARGO_TOML], {
    cwd: process.cwd(),
    stdout: "pipe",
    stderr: "pipe",
    env: {
      ...process.env,
      // Avoid interactive rustup prompts in CI/agents.
      RUSTUP_TOOLCHAIN: process.env.RUSTUP_TOOLCHAIN ?? "1.97.1",
    },
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  if (exitCode === 0) {
    return [];
  }
  const detail = trimCargoFailureDetail(
    [stderr, stdout].filter((chunk) => chunk.trim().length > 0).join("\n"),
  );
  return [
    {
      filePath: CARGO_TOML,
      line: 1,
      message: `cargo check failed (exit ${String(exitCode)}). Tauri desktop must compile on this host.\n${detail}`,
    },
  ];
};

export const collectDesktopPackageViolations = async (options?: {
  skipCargoCheck?: boolean;
}): Promise<ValidationViolation[]> => {
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

  violations.push(...(await collectMissingModSources()));

  if (!options?.skipCargoCheck && process.env.BAO_SKIP_DESKTOP_CARGO_CHECK !== "1") {
    violations.push(...(await runCargoCheck()));
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
