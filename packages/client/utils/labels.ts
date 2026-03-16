import type { JobExperienceLevel } from "@bao/shared";

type Translate = (key: string, params?: Record<string, unknown>) => string;

const EXPERIENCE_LABEL_KEYS = [
  ["entry", "jobsPage.options.experience.entry"],
  ["junior", "jobsPage.options.experience.junior"],
  ["mid", "jobsPage.options.experience.mid"],
  ["senior", "jobsPage.options.experience.senior"],
  ["principal", "jobsPage.options.experience.principal"],
  ["director", "jobsPage.options.experience.director"],
] as const satisfies ReadonlyArray<readonly [JobExperienceLevel, string]>;

const STUDIO_TYPE_LABEL_KEYS = [
  ["AAA", "studiosIndex.options.type.aaa"],
  ["Indie", "studiosIndex.options.type.indie"],
  ["Mobile", "studiosIndex.options.type.mobile"],
  ["VR/AR", "studiosIndex.options.type.vrAr"],
  ["Platform", "studiosIndex.options.type.platform"],
  ["Esports", "studiosIndex.options.type.esports"],
  ["General", "studiosIndex.options.type.general"],
  ["Publisher", "studiosIndex.options.type.publisher"],
  ["Services", "studiosIndex.options.type.services"],
  ["AI/Tech", "studiosIndex.options.type.aiTech"],
  ["Mid-size", "studiosIndex.options.type.midSize"],
  ["Unknown", "studiosIndex.options.type.unknown"],
] as const;

const STUDIO_SIZE_LABEL_KEYS = [
  ["50-199", "studiosIndex.options.size.range50To199"],
  ["200-999", "studiosIndex.options.size.range200To999"],
  ["500+", "studiosIndex.options.size.range500Plus"],
  ["1000+", "studiosIndex.options.size.range1000Plus"],
  ["N/A", "studiosIndex.options.size.notAvailable"],
] as const;

const PLATFORM_LABEL_KEYS = [
  ["PC", "jobsPage.options.platform.pc"],
  ["Console", "jobsPage.options.platform.console"],
  ["Mobile", "jobsPage.options.platform.mobile"],
  ["VR", "jobsPage.options.platform.vr"],
  ["AR", "jobsPage.options.platform.ar"],
  ["Web", "jobsPage.options.platform.web"],
  ["Switch", "jobsPage.options.platform.switch"],
  ["PlayStation", "jobsPage.options.platform.playStation"],
  ["Xbox", "jobsPage.options.platform.xbox"],
  ["Steam", "jobsPage.options.platform.steam"],
] as const;

const findLabelKey = (
  entries: ReadonlyArray<readonly [string, string]>,
  value: string,
): string | null => {
  for (const [candidate, key] of entries) {
    if (candidate === value) {
      return key;
    }
  }

  return null;
};

/**
 * Translate a job experience level value using the shared job labels.
 */
export const jobExperienceLabel = (
  t: Translate,
  value: string | undefined | null,
): string => {
  const normalizedValue = value?.trim() ?? "";
  if (normalizedValue.length === 0) {
    return "";
  }

  const key = findLabelKey(EXPERIENCE_LABEL_KEYS, normalizedValue);
  if (key !== null) {
    return t(key);
  }

  return normalizedValue;
};

/**
 * Translate a studio type value using the shared job label map for types.
 */
export const studioTypeLabel = (
  t: Translate,
  value: string | undefined | null,
): string => {
  const normalizedValue = value?.trim() ?? "";
  if (normalizedValue.length === 0) {
    return t("studiosIndex.card.unknownType");
  }

  const key = findLabelKey(STUDIO_TYPE_LABEL_KEYS, normalizedValue);
  if (key !== null) {
    return t(key);
  }

  return normalizedValue;
};

/**
 * Provide a localized fallback for studio size labels.
 */
export const studioSizeLabel = (
  t: Translate,
  value: string | undefined | null,
): string => {
  const normalizedValue = value?.trim() ?? "";
  if (normalizedValue.length === 0) {
    return t("studiosIndex.card.unknownSize");
  }

  const key = findLabelKey(STUDIO_SIZE_LABEL_KEYS, normalizedValue);
  if (key !== null) {
    return t(key);
  }

  return normalizedValue;
};

/**
 * Translate a platform value using the shared job platform labels.
 */
export const platformLabel = (
  t: Translate,
  value: string | undefined | null,
): string => {
  const normalizedValue = value?.trim() ?? "";
  if (normalizedValue.length === 0) {
    return "";
  }
  const key = findLabelKey(PLATFORM_LABEL_KEYS, normalizedValue);
  if (key !== null) {
    return t(key);
  }
  return normalizedValue;
};

/**
 * Provide a localized label for game genre domain values.
 */
export const gameGenreLabel = (
  t: Translate,
  value: string | undefined | null,
): string => {
  const normalizedValue = value?.trim() ?? "";
  if (normalizedValue.length === 0) {
    return "";
  }
  return t("jobsPage.options.genre", { value: normalizedValue });
};
