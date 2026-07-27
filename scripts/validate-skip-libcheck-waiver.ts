/**
 * Enforces the domain-owner exception for `skipLibCheck`.
 *
 * Ideal: `skipLibCheck: false` in tsconfig.base.json.
 * Allowed waiver: `skipLibCheck: true` only when STACK-CONTRACT documents the
 * exact upstream packages and `bun run typecheck` is wired to the source-only
 * gate (`scripts/typecheck-workspace.ts`).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { safeParseJson, type JsonObject, type JsonValue } from "../packages/shared/src/utils/json";
import { writeError, writeOutput } from "./utils/cli-output";

const ROOT = process.cwd();
const TSCONFIG_PATH = join(ROOT, "tsconfig.base.json");
const STACK_CONTRACT_PATH = join(ROOT, "docs/STACK-CONTRACT.md");
const PACKAGE_JSON_PATH = join(ROOT, "package.json");
const TYPECHECK_WORKSPACE_PATH = join(ROOT, "scripts/typecheck-workspace.ts");

const REQUIRED_WAIVER_MARKERS = [
  "skipLibCheck",
  "waived",
  "elysia",
  "drizzle-orm",
  "typecheck-workspace",
] as const;

type Violation = { message: string };

const isRecord = (v: JsonValue | null): v is JsonObject =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const stripLineComments = (raw: string): string => raw.replace(/^\s*\/\/.*$/gm, "");

const parseJsonCommentTolerant = (path: string): JsonObject | null => {
  const raw = readFileSync(path, "utf8");
  const parsed = safeParseJson(stripLineComments(raw));
  return isRecord(parsed) ? parsed : null;
};

/** Optional in-memory inputs so the gate can be exercised without touching disk. */
type WaiverInput = {
  tsconfigText?: string;
  stackContractText?: string;
  packageJsonText?: string;
  typecheckWorkspaceExists?: boolean;
};

/** How the `skipLibCheck` setting resolves. */
type SkipLibCheckState =
  | { kind: "invalid-json" }
  | { kind: "missing-compiler-options" }
  | { kind: "disabled" }
  | { kind: "not-boolean" }
  | { kind: "waived" };

/**
 * Resolves tsconfig.base.json from the supplied text or from disk.
 */
const resolveTsconfig = (tsconfigText?: string): JsonObject | null => {
  if (tsconfigText === undefined) {
    return parseJsonCommentTolerant(TSCONFIG_PATH);
  }
  const parsed = safeParseJson(stripLineComments(tsconfigText));
  return isRecord(parsed) ? parsed : null;
};

/**
 * Classifies the `skipLibCheck` setting so the waiver checks stay flat.
 */
const readSkipLibCheckState = (tsconfigText?: string): SkipLibCheckState => {
  const tsconfig = resolveTsconfig(tsconfigText);
  if (!tsconfig) {
    return { kind: "invalid-json" };
  }

  const compilerOptions = tsconfig.compilerOptions;
  if (!isRecord(compilerOptions)) {
    return { kind: "missing-compiler-options" };
  }

  const skipLibCheck = compilerOptions.skipLibCheck;
  if (skipLibCheck === false) {
    return { kind: "disabled" };
  }
  return skipLibCheck === true ? { kind: "waived" } : { kind: "not-boolean" };
};

/**
 * Requires STACK-CONTRACT to name every package the waiver covers.
 */
const collectStackContractViolations = (stackContractText?: string): Violation[] => {
  const stackContract = stackContractText ?? readFileSync(STACK_CONTRACT_PATH, "utf8");
  const stackLower = stackContract.toLowerCase();
  return REQUIRED_WAIVER_MARKERS.filter((marker) => !stackLower.includes(marker.toLowerCase())).map(
    (marker) => ({
      message: `docs/STACK-CONTRACT.md must document the skipLibCheck waiver (missing marker: ${marker}).`,
    }),
  );
};

/**
 * Requires the `typecheck` script to run the source-only workspace gate.
 */
const collectTypecheckScriptViolations = (packageJsonText?: string): Violation[] => {
  const packageJson = safeParseJson(packageJsonText ?? readFileSync(PACKAGE_JSON_PATH, "utf8"));
  const scripts = isRecord(packageJson) ? packageJson.scripts : null;
  const typecheckScript =
    isRecord(scripts) && typeof scripts.typecheck === "string" ? scripts.typecheck : "";
  return typecheckScript.includes("typecheck-workspace")
    ? []
    : [
        {
          message:
            'package.json "typecheck" must run scripts/typecheck-workspace.ts while skipLibCheck is waived.',
        },
      ];
};

/**
 * Requires the source-only gate script to exist on disk.
 */
const collectWorkspaceGateViolations = (typecheckWorkspaceExists?: boolean): Violation[] => {
  const workspaceExists = typecheckWorkspaceExists ?? existsSync(TYPECHECK_WORKSPACE_PATH);
  return workspaceExists
    ? []
    : [
        {
          message:
            "scripts/typecheck-workspace.ts must exist to gate first-party source errors while skipLibCheck is waived.",
        },
      ];
};

export const collectSkipLibCheckWaiverViolations = (input?: WaiverInput): Violation[] => {
  const state = readSkipLibCheckState(input?.tsconfigText);

  if (state.kind === "invalid-json") {
    return [{ message: "tsconfig.base.json must be valid JSON." }];
  }
  if (state.kind === "missing-compiler-options") {
    return [{ message: "tsconfig.base.json must declare compilerOptions." }];
  }
  if (state.kind === "disabled") {
    return [];
  }
  if (state.kind === "not-boolean") {
    return [
      {
        message:
          'tsconfig.base.json must set "skipLibCheck" to false, or true only under the documented waiver.',
      },
    ];
  }

  return [
    ...collectStackContractViolations(input?.stackContractText),
    ...collectTypecheckScriptViolations(input?.packageJsonText),
    ...collectWorkspaceGateViolations(input?.typecheckWorkspaceExists),
  ];
};

if (import.meta.main) {
  const violations = collectSkipLibCheckWaiverViolations();
  if (violations.length === 0) {
    await writeOutput("skipLibCheck waiver validation passed.");
  } else {
    await writeError("skipLibCheck waiver validation failed:");
    await Promise.all(violations.map((violation) => writeError(`- ${violation.message}`)));
    process.exit(1);
  }
}
