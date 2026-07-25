import {
  SKILL_CATEGORY_IDS,
  SKILL_DEMAND_LEVEL_IDS,
  SKILL_EVIDENCE_TYPE_IDS,
  SKILL_EVIDENCE_VERIFICATION_STATUS_IDS,
  type SkillEvidence,
  type SkillMapping,
} from "@bao/shared/types/skill-mapping";
import {
  asBoolean,
  asNumber,
  asString,
  asStringArray,
  isRecord,
} from "@bao/shared/utils/type-guards";
import { asEnum, toResumeCollection } from "~/composables/api-normalizer-shared";
import { SKILL_MAPPING_DEFAULT_CONFIDENCE } from "~/constants/numeric-ui";

const SKILL_EVIDENCE_TYPES: readonly SkillEvidence["type"][] = SKILL_EVIDENCE_TYPE_IDS;
const SKILL_EVIDENCE_STATUSES: readonly SkillEvidence["verificationStatus"][] =
  SKILL_EVIDENCE_VERIFICATION_STATUS_IDS;
const SKILL_CATEGORIES: readonly SkillMapping["category"][] = SKILL_CATEGORY_IDS;
const DEMAND_LEVELS: readonly SkillMapping["demandLevel"][] = SKILL_DEMAND_LEVEL_IDS;

const toSkillEvidence = (value: unknown): SkillEvidence | null => {
  if (!isRecord(value)) {
    return null;
  }

  const evidenceId = asString(value.id);
  const title = asString(value.title);
  const description = asString(value.description);
  if (!(evidenceId && title && description)) {
    return null;
  }

  return {
    id: evidenceId,
    type: asEnum(value.type, SKILL_EVIDENCE_TYPES) ?? "document",
    title,
    description,
    url: asString(value.url),
    verificationStatus: asEnum(value.verificationStatus, SKILL_EVIDENCE_STATUSES) ?? "pending",
  };
};

export const toSkillMapping = (value: unknown): SkillMapping | null => {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  const gameExpression = asString(value.gameExpression);
  const transferableSkill = asString(value.transferableSkill);
  if (!(id && gameExpression && transferableSkill)) return null;

  const evidence = toResumeCollection(value.evidence, toSkillEvidence);
  const category = asEnum(value.category, SKILL_CATEGORIES) ?? "technical";
  const demandLevel = asEnum(value.demandLevel, DEMAND_LEVELS) ?? "medium";

  return {
    id,
    gameExpression,
    transferableSkill,
    industryApplications: asStringArray(value.industryApplications),
    evidence,
    confidence: asNumber(value.confidence) ?? SKILL_MAPPING_DEFAULT_CONFIDENCE,
    category,
    demandLevel,
    verified: asBoolean(value.verified) ?? false,
    aiGenerated: asBoolean(value.aiGenerated),
  };
};
