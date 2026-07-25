import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { reportViolations, type ValidationViolation } from "./utils/validation-helpers";

/**
 * Capability ↔ surface binding gate — proves every page on disk is declared
 * in the feature-trace-matrix (no orphan pages), and every page in the matrix
 * exists on disk (no phantom pages). The matrix is the SSOT for the
 * route-group → service → UI → test traceability.
 *
 * This is the ORPHAN/PHANTOM gate: a page that ships without a matrix entry
 * has no declared capability (orphan), and a matrix entry referencing a
 * missing page is a phantom (declared but never built).
 */

const PAGES_DIR = "packages/client/pages";
const MATRIX_PATH = "docs/feature-trace-matrix.md";
const PAGE_REFERENCE_PATTERN = /packages\/client\/pages\/[^\s|)]+\.vue/gu;

const REDIRECT_PATTERN = /definePageMeta\s*\(\s*\{[^}]*redirect\b/su;

const collectDiskPages = async (): Promise<Set<string>> => {
  const glob = new Bun.Glob(`${PAGES_DIR}/**/*.vue`);
  const files = await Array.fromAsync(glob.scan({ cwd: process.cwd(), onlyFiles: true }));
  const realPages = new Set<string>();
  for (const filePath of files) {
    const normalized = filePath.replace(/\\/gu, "/");
    const content = readFileSync(resolve(process.cwd(), normalized), "utf-8");
    // Skip redirect-only pages — they are technical redirects, not capability surfaces.
    if (!REDIRECT_PATTERN.test(content)) {
      realPages.add(normalized);
    }
  }
  return realPages;
};

const collectMatrixPages = (): Set<string> => {
  const content = readFileSync(resolve(process.cwd(), MATRIX_PATH), "utf-8");
  const matches = content.match(PAGE_REFERENCE_PATTERN) ?? [];
  return new Set(matches);
};

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const diskPages = await collectDiskPages();
  const matrixPages = collectMatrixPages();
  const violations: ValidationViolation[] = [];

  for (const page of diskPages) {
    if (!matrixPages.has(page)) {
      violations.push({
        filePath: page,
        line: 1,
        message: `Orphan page: "${page}" exists on disk but is not referenced in ${MATRIX_PATH}. Add it to the feature-trace-matrix route group table.`,
      });
    }
  }

  for (const page of matrixPages) {
    if (!diskPages.has(page)) {
      violations.push({
        filePath: MATRIX_PATH,
        line: 1,
        message: `Phantom page: "${page}" is referenced in the feature-trace-matrix but does not exist on disk.`,
      });
    }
  }

  return violations;
};

if (import.meta.main) {
  await reportViolations(
    "Capability surface binding validation failed:",
    await collectViolations(),
    "Capability surface binding validation passed.",
  );
}

export { collectDiskPages, collectMatrixPages, collectViolations };
