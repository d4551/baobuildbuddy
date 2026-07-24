#!/usr/bin/env bun
/**
 * Build complete brutalise scan payload with all source files.
 * Outputs JSON to stdout for MCP call.
 */

import { collectBrutaliseScanFiles } from "./brutalise-scan-files";

const root = process.cwd();
const allFiles = await collectBrutaliseScanFiles(root);

const payload = { targetDir: root, files: allFiles };
process.stdout.write(JSON.stringify(payload));
