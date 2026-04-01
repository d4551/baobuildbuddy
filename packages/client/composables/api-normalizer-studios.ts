import type { GameStudio } from "@bao/shared/types/interview";
import { normalizeScrapePersonaEnrichment } from "@bao/shared/utils/scrape-enrichment";
import {
  asBoolean,
  asNumber,
  asString,
  asStringArray,
  isRecord,
} from "@bao/shared/utils/type-guards";
import { asEnum, normalizeStudioCulture } from "~/composables/api-normalizer-shared";

const STUDIO_CATEGORIES: readonly Exclude<GameStudio["category"], undefined>[] = [
  "AAA",
  "Indie",
  "Mobile",
  "VR/AR",
  "Platform",
  "Esports",
  "International",
];

export const toGameStudio = (value: unknown): GameStudio | null => {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  const name = asString(value.name);
  if (!(id && name)) return null;

  return {
    id,
    name,
    logo: asString(value.logo),
    website: asString(value.website),
    location: asString(value.location) ?? "",
    size: asString(value.size) ?? "",
    type: asString(value.type) ?? "",
    founded: asNumber(value.founded),
    description: asString(value.description),
    games: asStringArray(value.games),
    technologies: asStringArray(value.technologies),
    culture: normalizeStudioCulture(value.culture, { isRecord, asString, asStringArray }),
    commonRoles: asStringArray(value.commonRoles),
    interviewStyle: asString(value.interviewStyle),
    remoteWork: asBoolean(value.remoteWork),
    category: asEnum(value.category, STUDIO_CATEGORIES),
    region: asString(value.region),
    benefits: asStringArray(value.benefits),
    enrichment: normalizeScrapePersonaEnrichment(value.enrichment),
  };
};
