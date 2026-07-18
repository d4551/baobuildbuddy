/**
 * Shared helpers for .bao SSOT compliance scanning.
 *
 * Extracted from bao-ssot-compliance.spec.ts to keep files small and focused.
 */

import { join } from "node:path";

export const CLIENT_ROOT = join(import.meta.dirname, "..");
export const PAGES_DIR = join(CLIENT_ROOT, "pages");
export const COMPONENTS_DIR = join(CLIENT_ROOT, "components");
export const LAYOUTS_DIR = join(CLIENT_ROOT, "layouts");

export interface SSOTViolation {
  category: string;
  rule: string;
  evidence: string;
  fix: string;
}

export function relativePath(abs: string): string {
  return abs.replace(CLIENT_ROOT, "").replace(/^\//, "");
}
