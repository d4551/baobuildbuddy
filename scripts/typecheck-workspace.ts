/**
 * Runs package typecheck with TypeScript 7 (`@typescript/native`) and fails only
 * on first-party source errors. Upstream declaration noise from Elysia 2 / Drizzle
 * is reported in summary counts but does not fail the gate until those packages
 * ship TS7-clean `.d.ts` files (see docs/STACK-CONTRACT.md).
 */
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { writeError, writeOutput } from "./utils/cli-output";

const packages = ["shared", "scraper", "server", "client"] as const;
const tscBin = join(process.cwd(), "node_modules", "@typescript", "native", "bin", "tsc");

/**
 * The root project owns `scripts/**` and `drizzle.config.ts`. Only the four packages were
 * checked, so every validator, proof, and build script sat outside the type gate — an
 * unimported symbol there surfaced (if at all) as a vague type-aware lint error rather than
 * a compile failure. Root is checked as a peer of the packages.
 */
const ROOT_PROJECT = "root" as const;
const typecheckTargets = [ROOT_PROJECT, ...packages] as const;

const packageResults = typecheckTargets.map((pkg) => {
  const cwd = pkg === ROOT_PROJECT ? process.cwd() : join(process.cwd(), "packages", pkg);
  // Client typecheck self-bootstraps Nuxt + server generated types; use package script.
  const result =
    pkg === "client"
      ? spawnSync("bun", ["run", "typecheck"], {
          cwd,
          encoding: "utf8",
          env: process.env,
        })
      : spawnSync(process.execPath, [tscBin, "--noEmit", "--pretty", "false"], {
          cwd,
          encoding: "utf8",
          env: process.env,
        });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  const lines = output
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.includes("error TS"));
  const sourceErrors = lines.filter((line) => !line.includes("node_modules"));
  const upstreamErrors = lines.filter((line) => line.includes("node_modules"));
  return { pkg, sourceErrors, upstreamErrors };
});

await Promise.all(
  packageResults.map(({ pkg, sourceErrors, upstreamErrors }) =>
    writeOutput(
      `[typecheck:${pkg}] sourceErrors=${sourceErrors.length} upstreamDeclarationErrors=${upstreamErrors.length}`,
    ),
  ),
);

const allSourceErrors = packageResults.flatMap(({ sourceErrors }) => sourceErrors);
if (allSourceErrors.length > 0) {
  await Promise.all(allSourceErrors.map((line) => writeError(line)));
  process.exit(1);
}

await writeOutput("Workspace source typecheck passed (TypeScript 7 native).");
