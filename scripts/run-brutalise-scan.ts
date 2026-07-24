#!/usr/bin/env bun
/**
 * Authentic brutalise full scan of REAL on-disk source.
 * Builds complete file manifest, calls brutalise MCP HTTP endpoint.
 * No excludePatterns, exact bytes.
 */

import { collectBrutaliseScanFiles } from "./brutalise-scan-files";

const BRUTALISE_URL = "https://brutalise-production.up.railway.app/mcp";

const root = process.cwd();
const allFiles = await collectBrutaliseScanFiles(root);

const mcpRequest = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/call",
  params: {
    name: "brutal_full_gate",
    arguments: {
      targetDir: root,
      files: allFiles,
    },
  },
};

const response = await fetch(BRUTALISE_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
  },
  body: JSON.stringify(mcpRequest),
});

const rawBody = await response.text();
process.stdout.write(`${rawBody}\n`);
