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
import { isRecord } from "@bao/shared/utils/type-guards";
import { generateId } from "@bao/shared/utils/validation";

type DemandLevel = SkillMapping["demandLevel"];
type SkillEvidenceType = SkillEvidence["type"];
type SkillEvidenceVerificationStatus = SkillEvidence["verificationStatus"];

const asNonEmptyString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const isSkillCategory = (value: unknown): value is SkillCategory =>
  typeof value === "string" && SKILL_CATEGORY_IDS.some((categoryId) => categoryId === value);

const isDemandLevel = (value: unknown): value is DemandLevel =>
  typeof value === "string" &&
  SKILL_DEMAND_LEVEL_IDS.some((demandLevelId) => demandLevelId === value);

const isSkillEvidenceType = (value: unknown): value is SkillEvidenceType =>
  typeof value === "string" &&
  SKILL_EVIDENCE_TYPE_IDS.some((evidenceTypeId) => evidenceTypeId === value);

const isSkillEvidenceVerificationStatus = (
  value: unknown,
): value is SkillEvidenceVerificationStatus =>
  typeof value === "string" &&
  SKILL_EVIDENCE_VERIFICATION_STATUS_IDS.some(
    (verificationStatusId) => verificationStatusId === value,
  );

export const normalizeCategory = (value: unknown): SkillCategory =>
  isSkillCategory(value) ? value : "technical";

export const normalizeDemandLevel = (value: unknown): DemandLevel =>
  isDemandLevel(value) ? value : "medium";

export const normalizeStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .filter((entry): entry is string => typeof entry === "string")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0)
    : [];

const normalizeSkillEvidenceType = (value: unknown): SkillEvidenceType =>
  typeof value === "string" && isSkillEvidenceType(value) ? value : "document";

const normalizeSkillEvidenceVerification = (value: unknown): SkillEvidenceVerificationStatus =>
  typeof value === "string" && isSkillEvidenceVerificationStatus(value) ? value : "pending";

const normalizeSkillEvidenceEntry = (value: unknown): SkillEvidence | null => {
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

export const normalizeSkillEvidence = (value: unknown): SkillEvidence[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => normalizeSkillEvidenceEntry(entry))
    .filter((entry): entry is SkillEvidence => entry !== null);
};

export const clampConfidence = (value: number | undefined): number =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(100, Math.round(value)))
    : SKILLS_DEFAULT_CONFIDENCE;

export const mapSuggestedMappingToCreateInput = (suggestedMapping: Record<string, unknown>) => {
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
        ? Math.max(0, Math.min(100, Math.round(suggestedMapping.confidence)))
        : 60,
    category: normalizeCategory(suggestedMapping.category),
    demandLevel: normalizeDemandLevel(suggestedMapping.demandLevel),
    verified: false,
    aiGenerated: true,
  };
};
