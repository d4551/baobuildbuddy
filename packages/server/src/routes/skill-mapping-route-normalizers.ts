import { PERCENT_MAX } from "@bao/shared/constants/numeric";
import {
  SKILL_CATEGORY_IDS,
  SKILL_DEMAND_LEVEL_IDS,
  SKILL_EVIDENCE_TYPE_IDS,
  SKILL_EVIDENCE_VERIFICATION_STATUS_IDS,
  SKILLS_DEFAULT_CONFIDENCE,
  type SkillCategory,
  type SkillEvidence,
  type SkillMapping,
} from "@bao/shared/types/skill-mapping";
import type { JsonObject, JsonValue } from "@bao/shared/utils/json";
import { isRecord } from "@bao/shared/utils/type-guards";
import { generateId } from "@bao/shared/utils/validation";

type DemandLevel = SkillMapping["demandLevel"];
type SkillEvidenceType = SkillEvidence["type"];
type SkillEvidenceVerificationStatus = SkillEvidence["verificationStatus"];

const asNonEmptyString = (value: JsonValue | undefined): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const isSkillCategory = (value: string): value is SkillCategory =>
  SKILL_CATEGORY_IDS.some((categoryId) => categoryId === value);

const isDemandLevel = (value: string): value is DemandLevel =>
  SKILL_DEMAND_LEVEL_IDS.some((demandLevelId) => demandLevelId === value);

const isSkillEvidenceType = (value: string): value is SkillEvidenceType =>
  SKILL_EVIDENCE_TYPE_IDS.some((evidenceTypeId) => evidenceTypeId === value);

const isSkillEvidenceVerificationStatus = (
  value: string,
): value is SkillEvidenceVerificationStatus =>
  SKILL_EVIDENCE_VERIFICATION_STATUS_IDS.some(
    (verificationStatusId) => verificationStatusId === value,
  );

export const normalizeCategory = (value: JsonValue | undefined): SkillCategory =>
  typeof value === "string" && isSkillCategory(value) ? value : "technical";

export const normalizeDemandLevel = (value: JsonValue | undefined): DemandLevel =>
  typeof value === "string" && isDemandLevel(value) ? value : "medium";

export const normalizeStringArray = (value: JsonValue | undefined): string[] =>
  Array.isArray(value)
    ? value
        .filter((entry): entry is string => typeof entry === "string")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0)
    : [];

const normalizeSkillEvidenceType = (value: JsonValue | undefined): SkillEvidenceType =>
  typeof value === "string" && isSkillEvidenceType(value) ? value : "document";

const normalizeSkillEvidenceVerification = (
  value: JsonValue | undefined,
): SkillEvidenceVerificationStatus =>
  typeof value === "string" && isSkillEvidenceVerificationStatus(value) ? value : "pending";

const normalizeSkillEvidenceEntry = (value: JsonValue): SkillEvidence | null => {
  if (!isRecord(value)) {
    return null;
  }

  const title = asNonEmptyString(value.title);
  const description = asNonEmptyString(value.description);
  if (!(title && description)) {
    return null;
  }

  const evidenceEntry: SkillEvidence = {
    id: asNonEmptyString(value.id) ?? generateId(),
    type: normalizeSkillEvidenceType(value.type),
    title,
    description,
    verificationStatus: normalizeSkillEvidenceVerification(value.verificationStatus),
  };
  const url = asNonEmptyString(value.url);
  if (url) {
    evidenceEntry.url = url;
  }
  return evidenceEntry;
};

export const normalizeSkillEvidence = (value: JsonValue | undefined): SkillEvidence[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => normalizeSkillEvidenceEntry(entry))
    .filter((entry): entry is SkillEvidence => entry !== null);
};

export const clampConfidence = (value: number | undefined): number =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(PERCENT_MAX, Math.round(value)))
    : SKILLS_DEFAULT_CONFIDENCE;

export const mapSuggestedMappingToCreateInput = (suggestedMapping: JsonObject) => {
  const gameExpression = asNonEmptyString(suggestedMapping.gameExpression);
  const transferableSkill = asNonEmptyString(suggestedMapping.transferableSkill);
  if (!(gameExpression && transferableSkill)) return null;

  return {
    gameExpression,
    transferableSkill,
    industryApplications: normalizeStringArray(suggestedMapping.industryApplications),
    evidence: [] satisfies SkillEvidence[],
    confidence:
      typeof suggestedMapping.confidence === "number" &&
      Number.isFinite(suggestedMapping.confidence)
        ? Math.max(0, Math.min(PERCENT_MAX, Math.round(suggestedMapping.confidence)))
        : 60,
    category: normalizeCategory(suggestedMapping.category),
    demandLevel: normalizeDemandLevel(suggestedMapping.demandLevel),
    verified: false,
    aiGenerated: true,
  };
};
