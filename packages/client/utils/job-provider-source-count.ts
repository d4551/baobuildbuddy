import { safeParseJson } from "@bao/shared/utils/json";
import { isRecord } from "@bao/shared/utils/type-guards";
import type { JobProviderForm } from "~/components/settings/job-intelligence";
import { countConfiguredGamingPortals, parseGamingPortalsJson } from "~/utils/gaming-portals-form";

const countEnabledNamedEntries = (rawJson: string): number => {
  const parsed = safeParseJson(rawJson);
  if (!Array.isArray(parsed)) {
    return 0;
  }
  let count = 0;
  for (const entry of parsed) {
    if (!isRecord(entry)) {
      continue;
    }
    const enabled = entry.enabled === true;
    // `board` is the identity key in `greenhouseBoardConfigSchema`; omitting it made a
    // schema-valid, enabled Greenhouse board count as zero active sources.
    const hasIdentity =
      (typeof entry.board === "string" && entry.board.trim().length > 0) ||
      (typeof entry.token === "string" && entry.token.trim().length > 0) ||
      (typeof entry.slug === "string" && entry.slug.trim().length > 0) ||
      (typeof entry.id === "string" && entry.id.trim().length > 0) ||
      (typeof entry.name === "string" && entry.name.trim().length > 0);
    if (enabled && hasIdentity) {
      count += 1;
    }
  }
  return count;
};

/**
 * Counts job sources that are enabled with enough config to fetch.
 * Shared by Job Intelligence summary + providers workspace (SSOT).
 */
export function countActiveJobProviderSources(form: JobProviderForm): number {
  // Hitmarker is counted through its gaming-portal entry like every other
  // RPA-backed board; it no longer carries a separate API-provider flag.
  return (
    Number(countEnabledNamedEntries(form.greenhouseBoardsJson) > 0) +
    Number(countEnabledNamedEntries(form.leverCompaniesJson) > 0) +
    countConfiguredGamingPortals(parseGamingPortalsJson(form.gamingPortalsJson))
  );
}
