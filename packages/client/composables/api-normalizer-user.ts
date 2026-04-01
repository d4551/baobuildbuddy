import type { UserProfile } from "@bao/shared/types/user";
import {
  asBoolean,
  asNumber,
  asRecord,
  asString,
  asStringArray,
  isRecord,
} from "@bao/shared/utils/type-guards";
import { asEnum, asEnumArray } from "~/composables/api-normalizer-shared";

const USER_EXPERIENCE_LEVELS: readonly Exclude<
  UserProfile["gamingExperience"]["experienceLevel"],
  undefined
>[] = ["entry", "junior", "mid", "senior", "lead", "principal", "director"];

const USER_GAMING_SPECIALIZATIONS: readonly UserProfile["gamingExperience"]["specializations"][number][] =
  [
    "game-programming",
    "gameplay-programming",
    "engine-programming",
    "graphics-programming",
    "ai-programming",
    "ui-programming",
    "network-programming",
    "tools-programming",
    "game-design",
    "level-design",
    "narrative-design",
    "systems-design",
    "ui-ux-design",
    "3d-art",
    "2d-art",
    "concept-art",
    "character-art",
    "environment-art",
    "vfx-art",
    "animation",
    "rigging",
    "technical-art",
    "audio-design",
    "sound-engineering",
    "music-composition",
    "quality-assurance",
    "production",
    "project-management",
    "marketing",
    "community-management",
    "business-development",
    "data-analytics",
  ];

const USER_REMOTE_PREFERENCES: readonly NonNullable<
  UserProfile["careerGoals"]["remotePreference"]
>[] = ["onsite", "hybrid", "remote", "flexible"];

const toUserShippedTitle = (
  value: Record<string, unknown>,
): UserProfile["gamingExperience"]["shippedTitles"][number] => ({
  name: asString(value.name) ?? "",
  platforms: asStringArray(value.platforms),
  releaseDate: asString(value.releaseDate),
  role: asString(value.role) ?? "",
  teamSize: asNumber(value.teamSize),
});

const normalizeUserSalaryRange = (value: unknown): UserProfile["careerGoals"]["salaryRange"] => {
  const salaryRange = asRecord(value);
  if (!salaryRange) {
    return;
  }

  const min = asNumber(salaryRange.min);
  const max = asNumber(salaryRange.max);
  if (min === undefined || max === undefined) {
    return;
  }

  return {
    min,
    max,
    currency: asString(salaryRange.currency),
  };
};

const normalizeUserCareerGoals = (value: unknown): UserProfile["careerGoals"] => {
  const careerGoals = asRecord(value) ?? {};
  const remotePreference = asEnum(careerGoals.remotePreference, USER_REMOTE_PREFERENCES);
  const salaryRange = normalizeUserSalaryRange(careerGoals.salaryRange);

  return {
    desiredRoles: asStringArray(careerGoals.desiredRoles),
    preferredCompanySize: asStringArray(careerGoals.preferredCompanySize),
    preferredLocations: asStringArray(careerGoals.preferredLocations),
    willingToRelocate: asBoolean(careerGoals.willingToRelocate),
    ...(remotePreference ? { remotePreference } : {}),
    ...(salaryRange ? { salaryRange } : {}),
  };
};

const normalizeUserGamingExperience = (value: unknown): UserProfile["gamingExperience"] => {
  const gamingExperience = asRecord(value) ?? {};
  const shippedTitles = Array.isArray(gamingExperience.shippedTitles)
    ? gamingExperience.shippedTitles
        .map((entry) => (isRecord(entry) ? toUserShippedTitle(entry) : null))
        .filter(
          (entry): entry is UserProfile["gamingExperience"]["shippedTitles"][number] =>
            entry !== null,
        )
    : [];

  return {
    yearsInGaming: asNumber(gamingExperience.yearsInGaming),
    experienceLevel: asEnum(gamingExperience.experienceLevel, USER_EXPERIENCE_LEVELS),
    specializations: asEnumArray(gamingExperience.specializations, USER_GAMING_SPECIALIZATIONS),
    gameEngines: asStringArray(gamingExperience.gameEngines),
    platforms: asStringArray(gamingExperience.platforms),
    genres: asStringArray(gamingExperience.genres),
    shippedTitles,
  };
};

export const toUserProfile = (value: unknown): UserProfile | null => {
  if (!isRecord(value)) return null;

  return {
    id: asString(value.id) ?? "default",
    name: asString(value.name) ?? "",
    email: asString(value.email),
    phone: asString(value.phone),
    location: asString(value.location),
    website: asString(value.website),
    linkedin: asString(value.linkedin),
    github: asString(value.github),
    summary: asString(value.summary),
    currentRole: asString(value.currentRole),
    currentCompany: asString(value.currentCompany),
    yearsExperience: asNumber(value.yearsExperience),
    technicalSkills: asStringArray(value.technicalSkills),
    softSkills: asStringArray(value.softSkills),
    gamingExperience: normalizeUserGamingExperience(value.gamingExperience),
    careerGoals: normalizeUserCareerGoals(value.careerGoals),
  };
};
