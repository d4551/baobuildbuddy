import { existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Pure scraper-directory resolver. Runtime wiring lives in paths.ts.
 */
export function resolveScraperDirectory(cwd: string, configuredScraperDir?: string | null): string {
  const trimmed = configuredScraperDir?.trim();
  if (trimmed && trimmed.length > 0) {
    return resolve(trimmed);
  }

  const candidates = [
    resolve(cwd, "scraper"),
    resolve(cwd, "packages", "scraper"),
    resolve(cwd, "..", "packages", "scraper"),
    resolve(cwd, "..", "..", "packages", "scraper"),
    resolve(cwd, "..", "..", "..", "packages", "scraper"),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return candidates[0];
}
