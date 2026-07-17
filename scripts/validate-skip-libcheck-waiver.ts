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

const readJsonCommentTolerant = (path: string): Record<string, unknown> => {
  const raw = readFileSync(path, "utf8");
  // Strip // line comments used in tsconfig.base.json
  const withoutLineComments = raw.replace(/^\s*\/\/.*$/gm, "");
  return JSON.parse(withoutLineComments) as Record<string, unknown>;
};

export const collectSkipLibCheckWaiverViolations = (input?: {
  tsconfigText?: string;
  stackContractText?: string;
  packageJsonText?: string;
  typecheckWorkspaceExists?: boolean;
}): Violation[] => {
  const tsconfig =
    input?.tsconfigText !== undefined
      ? (JSON.parse(input.tsconfigText.replace(/^\s*\/\/.*$/gm, "")) as Record<string, unknown>)
      : readJsonCommentTolerant(TSCONFIG_PATH);
  const compilerOptions = tsconfig.compilerOptions;
  if (
    typeof compilerOptions !== "object" ||
    compilerOptions === null ||
    Array.isArray(compilerOptions)
  ) {
    return [{ message: "tsconfig.base.json must declare compilerOptions." }];
  }

  const skipLibCheck = (compilerOptions as Record<string, unknown>).skipLibCheck;
  if (skipLibCheck === false) {
    return [];
  }
  if (skipLibCheck !== true) {
    return [
      {
        message:
          'tsconfig.base.json must set "skipLibCheck" to false, or true only under the documented waiver.',
      },
    ];
  }

  const violations: Violation[] = [];
  const stackContract = input?.stackContractText ?? readFileSync(STACK_CONTRACT_PATH, "utf8");
  const stackLower = stackContract.toLowerCase();
  for (const marker of REQUIRED_WAIVER_MARKERS) {
    if (!stackLower.includes(marker.toLowerCase())) {
      violations.push({
        message: `docs/STACK-CONTRACT.md must document the skipLibCheck waiver (missing marker: ${marker}).`,
      });
    }
  }

  const packageJsonText = input?.packageJsonText ?? readFileSync(PACKAGE_JSON_PATH, "utf8");
  const packageJson = JSON.parse(packageJsonText) as {
    scripts?: Record<string, string>;
  };
  const typecheckScript = packageJson.scripts?.typecheck ?? "";
  if (!typecheckScript.includes("typecheck-workspace")) {
    violations.push({
      message:
        'package.json "typecheck" must run scripts/typecheck-workspace.ts while skipLibCheck is waived.',
    });
  }

  const workspaceExists = input?.typecheckWorkspaceExists ?? existsSync(TYPECHECK_WORKSPACE_PATH);
  if (!workspaceExists) {
    violations.push({
      message:
        "scripts/typecheck-workspace.ts must exist to gate first-party source errors while skipLibCheck is waived.",
    });
  }

  return violations;
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
