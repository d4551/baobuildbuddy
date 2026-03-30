import {
  generateId,
  isRecord,
  SKILL_CATEGORY_IDS,
  SKILL_DEMAND_LEVEL_IDS,
  SKILL_EVIDENCE_TYPE_IDS,
  SKILL_EVIDENCE_VERIFICATION_STATUS_IDS,
  SKILLS_DEFAULT_CONFIDENCE,
  type SkillCategory,
  type SkillEvidence,
  type SkillMapping,
} from "@bao/shared";

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

export const normalizeSkillEvidence = (value: unknown): SkillEvidence[] => {
  if (!Array.isArray(value)) return [];

  const normalized: SkillEvidence[] = [];
  for (const entry of value) {
    if (!isRecord(entry)) continue;
    const title = asNonEmptyString(entry.title);
    const description = asNonEmptyString(entry.description);
    if (!(title && description)) continue;

    const evidenceEntry: SkillEvidence = {
      id: asNonEmptyString(entry.id) ?? generateId(),
      type:
        typeof entry.type === "string" && isSkillEvidenceType(entry.type)
          ? entry.type
          : "document",
      title,
      description,
      verificationStatus:
        typeof entry.verificationStatus === "string" &&
        isSkillEvidenceVerificationStatus(entry.verificationStatus)
          ? entry.verificationStatus
          : "pending",
    };
    const url = asNonEmptyString(entry.url);
    if (url) {
      evidenceEntry.url = url;
    }
    normalized.push(evidenceEntry);
  }

  return normalized;
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
    evidence: [] as SkillEvidence[],
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
