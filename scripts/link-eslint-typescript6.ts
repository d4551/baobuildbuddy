/**
 * Bun installs `@typescript/native` as an alias of `typescript@7`, which makes
 * nested `require("typescript")` from typescript-eslint resolve to TS 7 (no
 * programmatic API → `ts.Extension.Cjs` crash). Pin eslint/ts-api-utils peers
 * to the TS 6.0.3 package that carries the API typescript-eslint needs.
 *
 * Idempotent. Invoked from root `postinstall` after `bun install`.
 */
import { existsSync, mkdirSync, readdirSync, rmSync, symlinkSync } from "node:fs";
import { join } from "node:path";
import { writeError, writeOutput } from "./utils/cli-output";

const ROOT = process.cwd();
const BUN_STORE = join(ROOT, "node_modules", ".bun");
const TS6_RELATIVE = "../../typescript@6.0.3/node_modules/typescript";
const TS6_ABSOLUTE = join(BUN_STORE, "typescript@6.0.3", "node_modules", "typescript");

const PACKAGE_PREFIXES = [
  "@typescript-eslint+typescript-estree@",
  "@typescript-eslint+parser@",
  "@typescript-eslint+eslint-plugin@",
  "@typescript-eslint+type-utils@",
  "@typescript-eslint+project-service@",
  "@typescript-eslint+utils@",
  "typescript-eslint@",
  "ts-api-utils@",
  "eslint-plugin-vue@",
  "vue-eslint-parser@",
] as const;

const linkTypescript6 = (packageDir: string): void => {
  const nodeModulesDir = join(packageDir, "node_modules");
  const linkPath = join(nodeModulesDir, "typescript");
  mkdirSync(nodeModulesDir, { recursive: true });
  rmSync(linkPath, { force: true });
  symlinkSync(TS6_RELATIVE, linkPath);
};

if (!existsSync(TS6_ABSOLUTE)) {
  await writeError("typescript@6.0.3 not found in bun store; skip eslint TS6 peer link.");
  process.exit(0);
}

if (!existsSync(BUN_STORE)) {
  await writeError("bun store missing; skip eslint TS6 peer link.");
  process.exit(0);
}

let linked = 0;
for (const entry of readdirSync(BUN_STORE)) {
  if (!PACKAGE_PREFIXES.some((prefix) => entry.startsWith(prefix))) continue;
  const packageDir = join(BUN_STORE, entry);
  if (!existsSync(packageDir)) continue;
  linkTypescript6(packageDir);
  linked += 1;
}

// Workspace package node_modules may also host eslint-plugin-vue / parsers.
const workspacePackageDirs = [
  "packages/client",
  "packages/server",
  "packages/shared",
  "packages/scraper",
];
for (const workspacePackage of workspacePackageDirs) {
  for (const nestedName of [
    "eslint-plugin-vue",
    "vue-eslint-parser",
    "typescript-eslint",
    "ts-api-utils",
  ]) {
    const packageDir = join(ROOT, workspacePackage, "node_modules", nestedName);
    if (!existsSync(packageDir)) continue;
    // Workspace packages resolve typescript via the root bun store; use an absolute-relative link.
    const nodeModulesDir = join(packageDir, "node_modules");
    const linkPath = join(nodeModulesDir, "typescript");
    mkdirSync(nodeModulesDir, { recursive: true });
    rmSync(linkPath, { force: true });
    symlinkSync(TS6_ABSOLUTE, linkPath);
    linked += 1;
  }
}

await writeOutput(`Linked typescript@6.0.3 into ${String(linked)} eslint peer package(s).`);
