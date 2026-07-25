/**
 * Search fabric SSOT: shared SEARCH_RESULT_TYPES ≡ client SEARCH_TYPE_ROUTE keys
 * ≡ server searchTypes import from shared.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { SEARCH_RESULT_TYPES } from "../packages/shared/src/constants/search";
import { reportViolations, type ValidationViolation } from "./utils/validation-helpers";

const CLIENT_ROUTE_FILE = "packages/client/composables/useWorkspaceSearch.ts";
const SERVER_CONTRACT_FILE = "packages/server/src/routes/search-route-contracts.ts";

const ROUTE_MAP_BLOCK_PATTERN = /export const SEARCH_TYPE_ROUTE[\s\S]*?=\s*\{([\s\S]*?)\};/u;
const ROUTE_KEY_PATTERN = /["']?([a-z-]+)["']?\s*:/gu;

export const collectSearchTypeParityViolations = (input: {
  clientRouteSource: string;
  serverContractSource: string;
}): ValidationViolation[] => {
  const violations: ValidationViolation[] = [];
  const expected = new Set<string>(SEARCH_RESULT_TYPES);

  if (!input.serverContractSource.includes("@bao/shared/constants/search")) {
    violations.push({
      filePath: SERVER_CONTRACT_FILE,
      line: 1,
      message:
        "search-route-contracts must import SEARCH_RESULT_TYPES from @bao/shared/constants/search",
    });
  }

  const routeBlock = input.clientRouteSource.match(ROUTE_MAP_BLOCK_PATTERN)?.[1] ?? "";
  if (routeBlock.length === 0) {
    violations.push({
      filePath: CLIENT_ROUTE_FILE,
      line: 1,
      message: "SEARCH_TYPE_ROUTE map missing or unparseable",
    });
    return violations;
  }

  const clientKeys = new Set<string>();
  for (const match of routeBlock.matchAll(ROUTE_KEY_PATTERN)) {
    const key = match[1];
    if (key) {
      clientKeys.add(key);
    }
  }

  for (const type of expected) {
    if (!clientKeys.has(type)) {
      violations.push({
        filePath: CLIENT_ROUTE_FILE,
        line: 1,
        message: `SEARCH_TYPE_ROUTE missing key "${type}" required by SEARCH_RESULT_TYPES`,
      });
    }
  }

  for (const key of clientKeys) {
    if (!expected.has(key)) {
      violations.push({
        filePath: CLIENT_ROUTE_FILE,
        line: 1,
        message: `SEARCH_TYPE_ROUTE has unknown key "${key}" not in SEARCH_RESULT_TYPES`,
      });
    }
  }

  return violations;
};

const main = async (): Promise<void> => {
  const root = process.cwd();
  const [clientRouteSource, serverContractSource] = await Promise.all([
    readFile(join(root, CLIENT_ROUTE_FILE), "utf8"),
    readFile(join(root, SERVER_CONTRACT_FILE), "utf8"),
  ]);
  await reportViolations(
    "Search type parity validation failed:",
    collectSearchTypeParityViolations({ clientRouteSource, serverContractSource }),
    "Search type parity validation passed.",
  );
};

if (import.meta.main) {
  await main();
}
