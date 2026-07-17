/**
 * Runs package typecheck with TypeScript 7 (`@typescript/native`) and fails only
 * on first-party source errors. Upstream declaration noise from Elysia 2 / Drizzle
 * under `skipLibCheck: false` is reported but does not fail the gate until those
 * packages ship TS7-clean `.d.ts` files.
 */
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { writeError, writeOutput } from "./utils/cli-output";

const packages = ["shared", "scraper", "server", "client"] as const;
const tscBin = join(process.cwd(), "node_modules", "@typescript", "native", "bin", "tsc");
let failed = false;

for (const pkg of packages) {
  const cwd = join(process.cwd(), "packages", pkg);
  const result = spawnSync(
    process.execPath,
    [tscBin, "--noEmit", "--pretty", "false"],
    {
      cwd,
      encoding: "utf8",
      env: process.env,
    },
  );
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  const lines = output
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.includes("error TS"));
  const sourceErrors = lines.filter((line) => !line.includes("node_modules"));
  const upstreamErrors = lines.filter((line) => line.includes("node_modules"));

  await writeOutput(
    `[typecheck:${pkg}] sourceErrors=${sourceErrors.length} upstreamDeclarationErrors=${upstreamErrors.length}`,
  );
  if (sourceErrors.length > 0) {
    await Promise.all(sourceErrors.map((line) => writeError(line)));
  }
  if (sourceErrors.length > 0) {
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

await writeOutput("Workspace source typecheck passed (TypeScript 7 native).");
