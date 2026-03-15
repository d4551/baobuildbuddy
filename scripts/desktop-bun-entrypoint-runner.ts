import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const [, executablePath, runtimeCwdArg, entrypointArg, ...entryArgs] = process.argv;

if (!(runtimeCwdArg && entrypointArg)) {
  throw new Error("Usage: <runtime-cwd> <entrypoint> [...entry-args]");
}

const runtimeCwd = resolve(runtimeCwdArg);
const entrypointPath = resolve(runtimeCwd, entrypointArg);

process.chdir(runtimeCwd);
process.argv = [executablePath ?? process.argv[0] ?? entrypointPath, entrypointPath, ...entryArgs];

await import(pathToFileURL(entrypointPath).href);
