import { describe, expect, test } from "bun:test";
import { collectSkipLibCheckWaiverViolations } from "./validate-skip-libcheck-waiver";

const validStack = `
| \`skipLibCheck\` | **true** (waived) | Elysia + drizzle-orm .d.ts fail under TS7. Use typecheck-workspace.
`;

const validPackage = JSON.stringify({
  scripts: { typecheck: "bun run scripts/typecheck-workspace.ts" },
});

describe("skipLibCheck waiver gate", () => {
  test("passes when skipLibCheck is false", () => {
    const violations = collectSkipLibCheckWaiverViolations({
      tsconfigText: JSON.stringify({ compilerOptions: { skipLibCheck: false } }),
      stackContractText: "",
      packageJsonText: JSON.stringify({ scripts: {} }),
      typecheckWorkspaceExists: false,
    });
    expect(violations).toHaveLength(0);
  });

  test("passes justified waiver with contract markers and source gate", () => {
    const violations = collectSkipLibCheckWaiverViolations({
      tsconfigText: JSON.stringify({ compilerOptions: { skipLibCheck: true } }),
      stackContractText: validStack,
      packageJsonText: validPackage,
      typecheckWorkspaceExists: true,
    });
    expect(violations).toHaveLength(0);
  });

  test("fails waiver without STACK-CONTRACT markers", () => {
    const violations = collectSkipLibCheckWaiverViolations({
      tsconfigText: JSON.stringify({ compilerOptions: { skipLibCheck: true } }),
      stackContractText: "no waiver here",
      packageJsonText: validPackage,
      typecheckWorkspaceExists: true,
    });
    expect(violations.some((v) => v.message.includes("STACK-CONTRACT"))).toBe(true);
  });

  test("fails waiver without source typecheck gate", () => {
    const violations = collectSkipLibCheckWaiverViolations({
      tsconfigText: JSON.stringify({ compilerOptions: { skipLibCheck: true } }),
      stackContractText: validStack,
      packageJsonText: JSON.stringify({ scripts: { typecheck: "tsc --noEmit" } }),
      typecheckWorkspaceExists: true,
    });
    expect(violations.some((v) => v.message.includes("typecheck-workspace"))).toBe(true);
  });
});
