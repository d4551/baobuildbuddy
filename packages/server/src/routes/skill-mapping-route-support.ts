import {
  API_ERROR_SKILL_MAPPING_ALREADY_DELETED,
  API_ERROR_SKILL_MAPPING_NOT_FOUND,
} from "@bao/shared/constants/api-errors";
import { API_MESSAGE_SKILL_MAPPING_DELETED } from "@bao/shared/constants/api-messages";
import { ROUTE_GAMIFICATION_XP } from "@bao/shared/constants/gamification";
import {
  HTTP_STATUS_CREATED,
  HTTP_STATUS_GONE,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
} from "@bao/shared/constants/http";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { skillMappings } from "../db/schema/skill-mappings";
import { gamificationService } from "../services/gamification-service";
import { skillMappingService } from "../services/skill-mapping-service";
import type {
  SkillMappingMutationBody,
  SkillMappingRouteSetState,
  SkillMappingsQuery,
  SkillMappingUpdateBody,
} from "./skill-mapping-route-contracts";
import {
  clampConfidence,
  normalizeCategory,
  normalizeDemandLevel,
  normalizeSkillEvidence,
  normalizeStringArray,
} from "./skill-mapping-route-normalizers";

export const listSkillMappings = async (query: SkillMappingsQuery) => {
  let results = await db.select().from(skillMappings).orderBy(desc(skillMappings.createdAt));

  if (query.category) {
    results = results.filter((mapping) => mapping.category === query.category);
  }

  if (query.search) {
    const normalizedSearch = query.search.toLowerCase();
    results = results.filter(
      (mapping) =>
        mapping.gameExpression.toLowerCase().includes(normalizedSearch) ||
        mapping.transferableSkill.toLowerCase().includes(normalizedSearch),
    );
  }

  return results;
};

export const createSkillMappingFromBody = async (body: SkillMappingMutationBody) => {
  const mapping = await skillMappingService.createMapping({
    gameExpression: body.gameExpression,
    transferableSkill: body.transferableSkill,
    industryApplications: normalizeStringArray(body.industryApplications),
    evidence: normalizeSkillEvidence(body.evidence),
    confidence: clampConfidence(body.confidence),
    category: normalizeCategory(body.category),
    demandLevel: normalizeDemandLevel(body.demandLevel),
    aiGenerated: body.aiGenerated === true,
    verified: false,
  });

  gamificationService.trackActionFireAndForget(
    "skillsMapped",
    ROUTE_GAMIFICATION_XP.skillsMapped,
    "skill_mapped",
  );

  return {
    mapping,
    statusCode: HTTP_STATUS_CREATED,
  };
};

export const updateSkillMappingFromBody = async (
  id: string,
  body: SkillMappingUpdateBody,
  set: SkillMappingRouteSetState,
) => {
  const updated = await skillMappingService.updateMapping(id, {
    gameExpression: body.gameExpression,
    transferableSkill: body.transferableSkill,
    industryApplications: body.industryApplications
      ? normalizeStringArray(body.industryApplications)
      : undefined,
    evidence: body.evidence ? normalizeSkillEvidence(body.evidence) : undefined,
    confidence: body.confidence,
    category: body.category ? normalizeCategory(body.category) : undefined,
    demandLevel: body.demandLevel ? normalizeDemandLevel(body.demandLevel) : undefined,
    aiGenerated: body.aiGenerated,
  });

  if (!updated) {
    set.status = HTTP_STATUS_NOT_FOUND;
    return { error: API_ERROR_SKILL_MAPPING_NOT_FOUND };
  }

  return updated;
};

export const deleteSkillMappingById = async (id: string, set: SkillMappingRouteSetState) => {
  const existing = await db.select().from(skillMappings).where(eq(skillMappings.id, id));
  if (existing.length === 0) {
    set.status = HTTP_STATUS_NOT_FOUND;
    return {
      kind: "not-found" as const,
      payload: { error: API_ERROR_SKILL_MAPPING_NOT_FOUND },
    };
  }

  const deleted = await skillMappingService.deleteMapping(id);
  if (!deleted) {
    return {
      kind: "gone" as const,
      payload: { error: API_ERROR_SKILL_MAPPING_ALREADY_DELETED, id },
      statusCode: HTTP_STATUS_GONE,
    };
  }

  return {
    kind: "deleted" as const,
    payload: { message: API_MESSAGE_SKILL_MAPPING_DELETED, id },
    statusCode: HTTP_STATUS_OK,
  };
};

export const getSkillReadiness = async (jobId?: string) => {
  const readiness = await skillMappingService.getReadiness();
  return jobId ? { ...readiness, jobId } : readiness;
};
