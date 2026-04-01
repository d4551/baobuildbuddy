import {
  SKILL_CATEGORY_IDS,
  SKILL_EVIDENCE_TYPE_IDS,
  SKILL_EVIDENCE_VERIFICATION_STATUS_IDS,
  type SkillCategory,
  type SkillEvidence,
  type SkillMapping,
} from "@bao/shared/types/skill-mapping";
import { isRecord } from "@bao/shared/utils/type-guards";
import type { skillMappings } from "../db/schema/skill-mappings";

type SkillMappingRow = typeof skillMappings.$inferSelect;
type DemandLevel = SkillMapping["demandLevel"];

const isSkillCategory = (value: string | null): value is SkillCategory =>
  typeof value === "string" && SKILL_CATEGORY_IDS.some((categoryId) => categoryId === value);

const isEvidenceType = (value: unknown): value is SkillEvidence["type"] =>
  typeof value === "string" && SKILL_EVIDENCE_TYPE_IDS.some((typeId) => typeId === value);

const isEvidenceStatus = (value: unknown): value is SkillEvidence["verificationStatus"] =>
  typeof value === "string" &&
  SKILL_EVIDENCE_VERIFICATION_STATUS_IDS.some((statusId) => statusId === value);

export const normalizeSkillCategory = (value: string | null): SkillCategory =>
  isSkillCategory(value) ? value : "technical";

export const normalizeDemandLevel = (value: string | null): DemandLevel =>
  value === "high" || value === "low" ? value : "medium";

const normalizeEvidenceType = (value: unknown): SkillEvidence["type"] =>
  isEvidenceType(value) ? value : "document";

const normalizeEvidenceStatus = (value: unknown): SkillEvidence["verificationStatus"] =>
  isEvidenceStatus(value) ? value : "pending";

export const normalizeEvidenceEntries = (value: unknown[] | null): SkillEvidence[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const entries: SkillEvidence[] = [];
  for (const evidence of value) {
    if (!isRecord(evidence)) continue;
    if (typeof evidence.id !== "string") continue;
    if (typeof evidence.title !== "string") continue;
    if (typeof evidence.description !== "string") continue;

    entries.push({
      id: evidence.id,
      type: normalizeEvidenceType(evidence.type),
      title: evidence.title,
      description: evidence.description,
      url: typeof evidence.url === "string" ? evidence.url : undefined,
      verificationStatus: normalizeEvidenceStatus(evidence.verificationStatus),
    });
  }

  return entries;
};

export const toSkillMapping = (row: SkillMappingRow): SkillMapping => ({
  id: row.id,
  gameExpression: row.gameExpression,
  transferableSkill: row.transferableSkill,
  industryApplications: row.industryApplications || [],
  evidence: normalizeEvidenceEntries(row.evidence),
  confidence: row.confidence || 50,
  category: normalizeSkillCategory(row.category),
  demandLevel: normalizeDemandLevel(row.demandLevel),
  verified: false,
  aiGenerated: row.aiGenerated ?? undefined,
});
