import type { GamingPortalConfig } from "@bao/shared/types/settings";
import { safeParseJson } from "@bao/shared/utils/json";
import { isRecord } from "@bao/shared/utils/type-guards";

type ApiPayload = Parameters<typeof isRecord>[0];

const readString = (value: ApiPayload, fallback = ""): string =>
  typeof value === "string" ? value : fallback;

const readBoolean = (value: ApiPayload, fallback = false): boolean =>
  typeof value === "boolean" ? value : fallback;

/**
 * Parses the settings gaming-portals JSON textarea into typed portal rows.
 * Invalid JSON or non-array payloads return an empty list (caller keeps raw text).
 */
export function parseGamingPortalsJson(raw: string): GamingPortalConfig[] {
  const parsed = safeParseJson(raw);
  if (!Array.isArray(parsed)) {
    return [];
  }

  const portals: GamingPortalConfig[] = [];
  for (const entry of parsed) {
    if (!isRecord(entry)) {
      continue;
    }
    const id = readString(entry.id);
    if (!id) {
      continue;
    }
    portals.push({
      id: id as GamingPortalConfig["id"],
      name: readString(entry.name, id),
      source: readString(entry.source, id),
      fallbackUrl: readString(entry.fallbackUrl),
      enabled: readBoolean(entry.enabled),
    });
  }
  return portals;
}

/**
 * Serializes portal rows back to the settings JSON textarea format.
 */
export function serializeGamingPortalsJson(portals: readonly GamingPortalConfig[]): string {
  return JSON.stringify(portals, null, 2);
}

/**
 * Returns a new portal list with one portal's enabled flag flipped.
 */
export function setGamingPortalEnabled(
  portals: readonly GamingPortalConfig[],
  portalId: string,
  enabled: boolean,
): GamingPortalConfig[] {
  return portals.map((portal) =>
    portal.id === portalId
      ? {
          ...portal,
          enabled,
        }
      : portal,
  );
}

/**
 * Count of portals that are both enabled and have a fallback URL (matches RPA audit configured).
 */
export function countConfiguredGamingPortals(portals: readonly GamingPortalConfig[]): number {
  return portals.filter((portal) => portal.enabled && portal.fallbackUrl.trim().length > 0).length;
}
