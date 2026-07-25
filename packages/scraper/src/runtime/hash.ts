import { SCRAPER_CONTENT_HASH_HEX_LENGTH } from "../constants/scrape-fields";

/**
 * Builds a deterministic content hash for normalized scraper rows.
 *
 * @param prefix Stable provider-specific prefix.
 * @param parts Canonical string parts used for hashing.
 * @returns Stable prefixed hash.
 */
export const buildScraperHash = (prefix: string, parts: readonly string[]): string => {
  const canonical = parts.map((part) => part.trim().toLowerCase()).join("|");
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(canonical);
  return `${prefix}-${hasher.digest("hex").slice(0, SCRAPER_CONTENT_HASH_HEX_LENGTH)}`;
};
