#!/usr/bin/env bun
/**
 * Canonical brutalise scan-file collector.
 *
 * Gathers the exact on-disk bytes of every source file in scope — no
 * excludePatterns, no edits — so brutalise audits the real tree. Shared by
 * `build-brutalise-payload.ts` (JSON payload to stdout) and
 * `run-brutalise-scan.ts` (direct MCP call).
 */

import { existsSync } from "node:fs";
import { join } from "node:path";

const SCAN_DIRS = [
  "packages/client/constants",
  "packages/client/components",
  "packages/client/pages",
  "packages/client/layouts",
  "packages/client/composables",
  "packages/client/utils",
  "packages/client/plugins",
  "packages/client/middleware",
  "packages/shared/src",
  "packages/server/src",
  "scripts",
] as const;

const EXCLUDE_PATTERN = /node_modules|\.nuxt|dist|\.output|\.git/u;
const SOURCE_GLOB = "**/*.{ts,vue,css}" as const;

export type BrutaliseScanFile = { path: string; content: string };

type ScanTarget = { scanDir: string; fullPath: string; relPath: string };

export async function collectBrutaliseScanFiles(root: string): Promise<BrutaliseScanFile[]> {
  const targetsByDir = await Promise.all(
    SCAN_DIRS.map(async (scanDir): Promise<ScanTarget[]> => {
      const fullDir = join(root, scanDir);
      if (!existsSync(fullDir)) return [];

      const glob = new Bun.Glob(SOURCE_GLOB);
      const paths = await Array.fromAsync(glob.scan({ cwd: fullDir, onlyFiles: true }));

      return paths
        .filter((relPath) => !EXCLUDE_PATTERN.test(relPath))
        .map((relPath) => ({ scanDir, fullPath: join(fullDir, relPath), relPath }));
    }),
  );

  const scanTargets = targetsByDir.flat();

  return Promise.all(
    scanTargets.map(
      async ({ scanDir, fullPath, relPath }): Promise<BrutaliseScanFile> => ({
        path: `${scanDir}/${relPath}`,
        content: await Bun.file(fullPath).text(),
      }),
    ),
  );
}
