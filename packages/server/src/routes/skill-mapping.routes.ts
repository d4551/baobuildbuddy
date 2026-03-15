import {
  AI_DEFAULT_TEMPERATURE_CREATIVE,
  API_ERROR_SKILL_MAPPING_ALREADY_DELETED,
  API_ERROR_SKILL_MAPPING_NOT_FOUND,
  API_MESSAGE_SKILL_ANALYSIS_COMPLETE,
  API_MESSAGE_SKILL_MAPPING_DELETED,
  API_ERROR_UNKNOWN,
  generateId,
  HTTP_STATUS_CREATED,
  HTTP_STATUS_GONE,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
  isRecord,
  parseJson,
  SCHEMA_MAX_ITEMS_LARGE,
  SCHEMA_MAX_LENGTH_ID,
  SCHEMA_MAX_LENGTH_LABEL,
  SCHEMA_MAX_LENGTH_LONG,
  SCHEMA_MAX_LENGTH_SHORT,
  ROUTE_GAMIFICATION_XP,
  SKILL_CATEGORY_IDS,
  SKILLS_DEFAULT_CONFIDENCE,
  SKILL_DEMAND_LEVEL_IDS,
  SKILL_EVIDENCE_TYPE_IDS,
  SKILL_EVIDENCE_VERIFICATION_STATUS_IDS,
  settle,
  type SkillCategory,
  type SkillEvidence,
  type SkillMapping,
} from "@bao/shared";
import { desc, eq } from "drizzle-orm";
import { Elysia, status, t } from "elysia";
import { z } from "zod";
import { db } from "../db/client";
import { settings } from "../db/schema/settings";
import { skillMappings } from "../db/schema/skill-mappings";
import { AIService } from "../services/ai/ai-service";
import { skillAnalysisPrompt } from "../services/ai/prompts";
import { gamificationService } from "../services/gamification-service";
import { skillMappingService } from "../services/skill-mapping-service";
import { createServerLogger } from "../utils/logger";
import { skillAnalysisRateLimit } from "../utils/rate-limit";

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

const normalizeCategory = (value: unknown): SkillCategory =>
  isSkillCategory(value) ? value : "technical";

const normalizeDemandLevel = (value: unknown): DemandLevel =>
  isDemandLevel(value) ? value : "medium";

const normalizeEvidenceType = (value: unknown): SkillEvidenceType =>
  isSkillEvidenceType(value) ? value : "document";

const normalizeEvidenceVerificationStatus = (value: unknown): SkillEvidenceVerificationStatus =>
  isSkillEvidenceVerificationStatus(value) ? value : "pending";

const normalizeSkillEvidence = (value: unknown): SkillEvidence[] => {
  if (!Array.isArray(value)) return [];

  const normalized: SkillEvidence[] = [];
  for (const entry of value) {
    if (!isRecord(entry)) continue;
    const title = asNonEmptyString(entry.title);
    const description = asNonEmptyString(entry.description);
    if (!(title && description)) continue;

    const evidenceEntry: SkillEvidence = {
      id: asNonEmptyString(entry.id) ?? generateId(),
      type: normalizeEvidenceType(entry.type),
      title,
      description,
      verificationStatus: normalizeEvidenceVerificationStatus(entry.verificationStatus),
    };
    const url = asNonEmptyString(entry.url);
    if (url) {
      evidenceEntry.url = url;
    }
    normalized.push(evidenceEntry);
  }

  return normalized;
};

const normalizeStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .filter((entry): entry is string => typeof entry === "string")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0)
    : [];

const skillMappingRoutesLogger = createServerLogger("skill-mapping-routes");
const SKILL_ANALYSIS_JSON_REGEX = /\{[\s\S]*\}/;

type SkillAnalyzeBody = {
  gameExperience?: Record<string, unknown>;
  resume?: Record<string, unknown>;
  autoCreateMappings?: boolean;
};
type RouteSetState = {
  status?: number | string;
};
type SkillAnalysisResponse = {
  message: string;
  detectedSkills: string[];
  suggestedMappings: Record<string, unknown>[];
  recommendations: string[];
  provider?: string;
};

const emptySkillAnalysisResponse = (message: string): SkillAnalysisResponse => ({
  message,
  detectedSkills: [],
  suggestedMappings: [],
  recommendations: [],
});

const collectSkillsToAnalyze = (body: SkillAnalyzeBody): string[] => {
  const skillsToAnalyze: string[] = [];
  if (body.gameExperience) {
    const gameExperience = isRecord(body.gameExperience) ? body.gameExperience : {};
    skillsToAnalyze.push(...normalizeStringArray(gameExperience.skills));
    skillsToAnalyze.push(...normalizeStringArray(gameExperience.achievements));
    skillsToAnalyze.push(...normalizeStringArray(gameExperience.roles));
  }
  if (body.resume) {
    const resume = isRecord(body.resume) ? body.resume : {};
    skillsToAnalyze.push(...normalizeStringArray(resume.skills));
    if (typeof resume.experience === "string") {
      skillsToAnalyze.push(resume.experience);
    }
  }
  return skillsToAnalyze;
};

const parseSkillAnalysisContent = (content: string): Record<string, unknown> => {
  const parsedResult: Record<string, unknown> = {
    detectedSkills: [],
    suggestedMappings: [],
    recommendations: [],
  };
  const jsonMatch = content.match(SKILL_ANALYSIS_JSON_REGEX);
  if (!jsonMatch) {
    parsedResult.recommendations = [content];
    return parsedResult;
  }

  const parsed = parseJson(jsonMatch[0], z.record(z.string(), z.unknown()));
  if (!parsed) {
    parsedResult.recommendations = [content];
    return parsedResult;
  }
  return parsed;
};

const normalizeSuggestedMappings = (value: unknown): Record<string, unknown>[] => {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord);
};

const mapSuggestedMappingToCreateInput = (suggestedMapping: Record<string, unknown>) => {
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

const autoCreateSuggestedMappings = async (suggestedMappings: Record<string, unknown>[]) => {
  const createOperations = suggestedMappings
    .map((suggestedMapping) => mapSuggestedMappingToCreateInput(suggestedMapping))
    .filter(
      (payload): payload is NonNullable<ReturnType<typeof mapSuggestedMappingToCreateInput>> => {
        return payload !== null;
      },
    )
    .map((payload) => settle(skillMappingService.createMapping(payload)));

  const createResults = await Promise.all(createOperations);
  for (const createResult of createResults) {
    if (createResult.status === "rejected") {
      skillMappingRoutesLogger.error("Failed to auto-create mapping:", createResult.reason);
    }
  }
};

const analyzeSkillMappings = async (
  body: SkillAnalyzeBody,
  set: RouteSetState,
): Promise<SkillAnalysisResponse> => {
  const settingsRows = await db.select().from(settings).limit(1);
  const aiService = AIService.fromSettings(settingsRows[0]);
  const skillsToAnalyze = collectSkillsToAnalyze(body);
  if (skillsToAnalyze.length === 0) {
    return emptySkillAnalysisResponse("No skills found in the provided data");
  }

  const response = await aiService.generate(skillAnalysisPrompt(skillsToAnalyze), {
    temperature: AI_DEFAULT_TEMPERATURE_CREATIVE,
    maxTokens: SCHEMA_MAX_LENGTH_LONG,
  });
  if (response.error) {
    set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
    return emptySkillAnalysisResponse(`AI analysis failed: ${response.error}`);
  }

  const parsedAnalysis = parseSkillAnalysisContent(response.content);
  const suggestedMappings = normalizeSuggestedMappings(parsedAnalysis.suggestedMappings);
  if (body.autoCreateMappings) {
    await autoCreateSuggestedMappings(suggestedMappings);
  }

  return {
    message: API_MESSAGE_SKILL_ANALYSIS_COMPLETE,
    detectedSkills: normalizeStringArray(parsedAnalysis.detectedSkills),
    suggestedMappings,
    recommendations: normalizeStringArray(parsedAnalysis.recommendations),
    provider: response.provider,
  };
};

export const skillMappingRoutes = new Elysia({ prefix: "/skills", tags: ["Skill Mapping"] })
  .use(skillAnalysisRateLimit)
  .get(
    "/mappings",
    async ({ query }) => {
      const { category, search } = query;

      let results = await db.select().from(skillMappings).orderBy(desc(skillMappings.createdAt));

      // Filter by category
      if (category) {
        results = results.filter((m) => m.category === category);
      }

      // Filter by search term
      if (search) {
        const normalizedSearch = search.toLowerCase();
        results = results.filter(
          (m) =>
            m.gameExpression.toLowerCase().includes(normalizedSearch) ||
            m.transferableSkill.toLowerCase().includes(normalizedSearch),
        );
      }

      return results;
    },
    {
      query: t.Object({
        category: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL })),
        search: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
      }),
    },
  )
  .post(
    "/mappings",
    async ({ body, set }) => {
      const confidence =
        typeof body.confidence === "number" && Number.isFinite(body.confidence)
          ? Math.max(0, Math.min(100, Math.round(body.confidence)))
          : SKILLS_DEFAULT_CONFIDENCE;
      const newMapping = await skillMappingService.createMapping({
        gameExpression: body.gameExpression,
        transferableSkill: body.transferableSkill,
        industryApplications: normalizeStringArray(body.industryApplications),
        evidence: normalizeSkillEvidence(body.evidence),
        confidence,
        category: normalizeCategory(body.category),
        demandLevel: normalizeDemandLevel(body.demandLevel),
        aiGenerated: body.aiGenerated === true,
        verified: false,
      });
      set.status = HTTP_STATUS_CREATED;
      gamificationService.trackActionFireAndForget(
        "skillsMapped",
        ROUTE_GAMIFICATION_XP.skillsMapped,
        "skill_mapped",
      );
      return newMapping;
    },
    {
      body: t.Object({
        gameExpression: t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
        transferableSkill: t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
        industryApplications: t.Optional(
          t.Array(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }), {
            maxItems: SCHEMA_MAX_ITEMS_LARGE,
          }),
        ),
        evidence: t.Optional(
          t.Array(t.Record(t.String(), t.Unknown()), { maxItems: SCHEMA_MAX_ITEMS_LARGE }),
        ),
        confidence: t.Optional(t.Number({ minimum: 0, maximum: 100 })),
        category: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
        demandLevel: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL })),
        aiGenerated: t.Optional(t.Boolean()),
      }),
    },
  )
  .put(
    "/mappings/:id",
    async ({ params, body, set }) => {
      const updated = await skillMappingService.updateMapping(params.id, {
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
    },
    {
      params: t.Object({
        id: t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
      }),
      body: t.Object({
        gameExpression: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
        transferableSkill: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
        industryApplications: t.Optional(
          t.Array(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }), {
            maxItems: SCHEMA_MAX_ITEMS_LARGE,
          }),
        ),
        evidence: t.Optional(
          t.Array(t.Record(t.String(), t.Unknown()), { maxItems: SCHEMA_MAX_ITEMS_LARGE }),
        ),
        confidence: t.Optional(t.Number({ minimum: 0, maximum: 100 })),
        category: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
        demandLevel: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL })),
        aiGenerated: t.Optional(t.Boolean()),
      }),
    },
  )
  .delete(
    "/mappings/:id",
    async ({ params, set }) => {
      const existing = await db.select().from(skillMappings).where(eq(skillMappings.id, params.id));
      if (existing.length === 0) {
        set.status = HTTP_STATUS_NOT_FOUND;
        return { error: API_ERROR_SKILL_MAPPING_NOT_FOUND };
      }

      const deleted = await skillMappingService.deleteMapping(params.id);
      if (!deleted) {
        return status(HTTP_STATUS_GONE, {
          error: API_ERROR_SKILL_MAPPING_ALREADY_DELETED,
          id: params.id,
        });
      }

      return status(HTTP_STATUS_OK, { message: API_MESSAGE_SKILL_MAPPING_DELETED, id: params.id });
    },
    {
      params: t.Object({ id: t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }) }),
    },
  )
  .get("/pathways", async () => {
    return await skillMappingService.getPathways();
  })
  .get(
    "/readiness",
    async ({ query }) => {
      const readiness = await skillMappingService.getReadiness();
      if (query?.jobId) {
        return {
          ...readiness,
          jobId: query.jobId,
        };
      }

      return readiness;
    },
    {
      query: t.Object({
        jobId: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
      }),
    },
  )
  .post(
    "/ai-analyze",
    async ({ body, set }) => {
      const analysisResult = await settle(analyzeSkillMappings(body, set));
      if (analysisResult.status === "rejected") {
        skillMappingRoutesLogger.error("AI analysis error:", analysisResult.reason);
        set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
        return {
          message: `Error during AI analysis: ${analysisResult.reason instanceof Error ? analysisResult.reason.message : API_ERROR_UNKNOWN}`,
          detectedSkills: [],
          suggestedMappings: [],
          recommendations: [],
        };
      }
      return analysisResult.value;
    },
    {
      body: t.Object({
        gameExperience: t.Optional(t.Record(t.String(), t.Unknown())),
        resume: t.Optional(t.Record(t.String(), t.Unknown())),
        autoCreateMappings: t.Optional(t.Boolean()),
      }),
    },
  );
