/**
 * Standalone NSIS `.nsi` file capture watcher.
 *
 * Runs as a separate process during `cargo tauri build` to capture the
 * NSIS installer script before Tauri v2 deletes it after `makensis`.
 *
 * Usage: bun run scripts/nsis-capture-watcher.ts <watchDir1> <watchDir2> ... -- <captureDir>
 *
 * The watcher polls the specified directories every 250ms for `.nsi` files
 * and copies them to the capture directory. It exits when stdin closes
 * (signalled by the parent process).
 */

import { cp, mkdir, readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const POLL_INTERVAL_MS = 250;
const args = process.argv.slice(2);
const separatorIndex = args.indexOf("--");

if (separatorIndex === -1 || separatorIndex === args.length - 1) {
  process.exit(1);
}

const watchDirs = args.slice(0, separatorIndex);
const captureDir = args[separatorIndex + 1];

if (!captureDir || watchDirs.length === 0) {
  process.exit(1);
}

await mkdir(captureDir, { recursive: true });

const captured = new Set<string>();

const poll = async (): Promise<void> => {
  for (const dir of watchDirs) {
    const dirStat = await stat(dir).catch(() => null);
    if (!dirStat?.isDirectory()) {
      continue;
    }
    const entries = await readdir(dir).catch(() => [] as string[]);
    const nsiFiles = entries.filter((entry) => entry.toLowerCase().endsWith(".nsi"));
    for (const nsiFile of nsiFiles) {
      const key = `${dir}/${nsiFile}`;
      if (captured.has(key)) {
        continue;
      }
      const sourcePath = join(dir, nsiFile);
      const destPath = join(captureDir, nsiFile);
      await cp(sourcePath, destPath).catch(() => undefined);
      captured.add(key);
    }
  }
};

/** Poll until stdin closes (parent process signals completion). */
const stdinClosed = new Promise<void>((resolve) => {
  process.stdin.on("end", resolve);
  process.stdin.on("close", resolve);
  process.stdin.resume();
});

let running = true;
void stdinClosed.then(() => {
  running = false;
});

while (running) {
  await poll();
  await new Promise<void>((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
}

/** Final poll to catch any last-moment writes. */
await poll();
