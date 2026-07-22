import { reportViolations, type ValidationViolation } from "./utils/validation-helpers";

/**
 * Desktop packaged runtime must not hardcode BAO_DISABLE_AUTH=true.
 * Auth opt-out is only allowed via explicit environment passthrough.
 */

const DESKTOP_MAIN = "packages/desktop/src-tauri/src/main.rs";
const HARDCODED_DISABLE_AUTH = /\.env\(\s*"BAO_DISABLE_AUTH"\s*,\s*"true"\s*\)/u;
const UNSAFE_INLINE_SCRIPT =
  /script-src[^;]*'unsafe-inline'/u;

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const violations: ValidationViolation[] = [];
  const mainFile = Bun.file(DESKTOP_MAIN);
  if (!(await mainFile.exists())) {
    violations.push({
      filePath: DESKTOP_MAIN,
      line: 1,
      message: "Desktop main.rs missing — cannot verify auth posture.",
    });
    return violations;
  }

  const mainContent = await mainFile.text();
  if (HARDCODED_DISABLE_AUTH.test(mainContent)) {
    const line = mainContent.split("\n").findIndex((entry) => HARDCODED_DISABLE_AUTH.test(entry)) + 1;
    violations.push({
      filePath: DESKTOP_MAIN,
      line: Math.max(line, 1),
      message:
        'Hardcoded BAO_DISABLE_AUTH="true" is forbidden. Pass through env only when explicitly set.',
    });
  }

  const tauriConfPath = "packages/desktop/src-tauri/tauri.conf.json";
  const tauriConf = Bun.file(tauriConfPath);
  if (await tauriConf.exists()) {
    const confText = await tauriConf.text();
    if (UNSAFE_INLINE_SCRIPT.test(confText)) {
      const line = confText.split("\n").findIndex((entry) => UNSAFE_INLINE_SCRIPT.test(entry)) + 1;
      violations.push({
        filePath: tauriConfPath,
        line: Math.max(line, 1),
        message: "CSP script-src must not include 'unsafe-inline' for packaged desktop.",
      });
    }
  }

  return violations;
};

if (import.meta.main) {
  await reportViolations(
    "Desktop auth posture validation failed:",
    await collectViolations(),
    "Desktop auth posture validation passed.",
  );
}

export { collectViolations };
