import { generateId, type SkillCategory, type SkillEvidence, type SkillMapping } from "@bao/shared";
import { desc } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { Elysia, status, t } from "elysia";
import { db } from "../db/client";
import { settings } from "../db/schema/settings";
import { skillMappings } from "../db/schema/skill-mappings";
import { AIService } from "../services/ai/ai-service";
import { skillAnalysisPrompt } from "../services/ai/prompts";
import { skillMappingService } from "../services/skill-mapping-service";

type DemandLevel = SkillMapping["demandLevel"];
type SkillEvidenceType = SkillEvidence["type"];
type SkillEvidenceVerificationStatus = SkillEvidence["verificationStatus"];

const SKILL_CATEGORIES: readonly SkillCategory[] = [
  "leadership",
  "community",
  "technical",
  "creative",
  "analytical",
  "communication",
  "project_management",
];

const DEMAND_LEVELS: readonly DemandLevel[] = ["high", "medium", "low"];

const SKILL_EVIDENCE_TYPES: readonly SkillEvidenceType[] = [
  "clip",
  "stats",
  "community",
  "achievement",
  "document",
  "portfolio_piece",
  "testimonial",
  "certificate",
];

const SKILL_EVIDENCE_VERIFICATION_STATUSES: readonly SkillEvidenceVerificationStatus[] = [
  "pending",
  "verified",
  "rejected",
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asNonEmptyString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const normalizeCategory = (value: unknown): SkillCategory =>
  typeof value === "string" && SKILL_CATEGORIES.includes(value as SkillCategory)
    ? (value as SkillCategory)
    : "technical";

const normalizeDemandLevel = (value: unknown): DemandLevel =>
  typeof value === "string" && DEMAND_LEVELS.includes(value as DemandLevel)
    ? (value as DemandLevel)
    : "medium";

const normalizeEvidenceType = (value: unknown): SkillEvidenceType =>
  typeof value === "string" && SKILL_EVIDENCE_TYPES.includes(value as SkillEvidenceType)
    ? (value as SkillEvidenceType)
    : "document";

const normalizeEvidenceVerificationStatus = (value: unknown): SkillEvidenceVerificationStatus =>
  typeof value === "string" &&
  SKILL_EVIDENCE_VERIFICATION_STATUSES.includes(value as SkillEvidenceVerificationStatus)
    ? (value as SkillEvidenceVerificationStatus)
    : "pending";

const normalizeSkillEvidence = (value: unknown): SkillEvidence[] => {
  if (!Array.isArray(value)) return [];

  const normalized: SkillEvidence[] = [];
  for (const entry of value) {
    if (!isRecord(entry)) continue;
    const title = asNonEmptyString(entry.title);
    const description = asNonEmptyString(entry.description);
    if (!title || !description) continue;

    normalized.push({
      id: asNonEmptyString(entry.id) ?? generateId(),
      type: normalizeEvidenceType(entry.type),
      title,
      description,
      url: asNonEmptyString(entry.url) ?? undefined,
      verificationStatus: normalizeEvidenceVerificationStatus(entry.verificationStatus),
    });
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

export const skillMappingRoutes = new Elysia({ prefix: "/skills" })
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
        category: t.Optional(t.String({ maxLength: 50 })),
        search: t.Optional(t.String({ maxLength: 200 })),
      }),
    },
  )
  .post(
    "/mappings",
    async ({ body, set }) => {
      const confidence =
        typeof body.confidence === "number" && Number.isFinite(body.confidence)
          ? Math.max(0, Math.min(100, Math.round(body.confidence)))
          : 50;
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
      set.status = 201;
      return newMapping;
    },
    {
      body: t.Object({
        gameExpression: t.String({ maxLength: 200 }),
        transferableSkill: t.String({ maxLength: 200 }),
        industryApplications: t.Optional(t.Array(t.String({ maxLength: 200 }), { maxItems: 50 })),
        evidence: t.Optional(t.Array(t.Record(t.String(), t.Any()), { maxItems: 50 })),
        confidence: t.Optional(t.Number({ minimum: 0, maximum: 100 })),
        category: t.Optional(t.String({ maxLength: 100 })),
        demandLevel: t.Optional(t.String({ maxLength: 50 })),
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
        set.status = 404;
        return { error: "Skill mapping not found" };
      }

      return updated;
    },
    {
      params: t.Object({
        id: t.String({ maxLength: 100 }),
      }),
      body: t.Object({
        gameExpression: t.Optional(t.String({ maxLength: 200 })),
        transferableSkill: t.Optional(t.String({ maxLength: 200 })),
        industryApplications: t.Optional(t.Array(t.String({ maxLength: 200 }), { maxItems: 50 })),
        evidence: t.Optional(t.Array(t.Record(t.String(), t.Any()), { maxItems: 50 })),
        confidence: t.Optional(t.Number({ minimum: 0, maximum: 100 })),
        category: t.Optional(t.String({ maxLength: 100 })),
        demandLevel: t.Optional(t.String({ maxLength: 50 })),
        aiGenerated: t.Optional(t.Boolean()),
      }),
    },
  )
  .delete(
    "/mappings/:id",
    async ({ params, set }) => {
      const existing = await db.select().from(skillMappings).where(eq(skillMappings.id, params.id));
      if (existing.length === 0) {
        set.status = 404;
        return { error: "Skill mapping not found" };
      }

      const deleted = await skillMappingService.deleteMapping(params.id);
      if (!deleted) {
        return status(410, { error: "Skill mapping already deleted", id: params.id });
      }

      return status(200, { message: "Skill mapping deleted", id: params.id });
    },
    {
      params: t.Object({ id: t.String({ maxLength: 100 }) }),
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
        jobId: t.Optional(t.String({ maxLength: 100 })),
      }),
    },
  )
  .post(
    "/ai-analyze",
    async ({ body, set }) => {
      const settingsRows = await db.select().from(settings).limit(1);

      try {
        const aiService = AIService.fromSettings(settingsRows[0]);

        const skillsToAnalyze: string[] = [];

        if (body.gameExperience) {
          const exp = isRecord(body.gameExperience) ? body.gameExperience : {};
          skillsToAnalyze.push(...normalizeStringArray(exp.skills));
          skillsToAnalyze.push(...normalizeStringArray(exp.achievements));
          skillsToAnalyze.push(...normalizeStringArray(exp.roles));
        }

        if (body.resume) {
          const resume = isRecord(body.resume) ? body.resume : {};
          skillsToAnalyze.push(...normalizeStringArray(resume.skills));
          if (resume.experience && typeof resume.experience === "string") {
            skillsToAnalyze.push(resume.experience);
          }
        }

        if (skillsToAnalyze.length === 0) {
          return {
            message: "No skills found in the provided data",
            detectedSkills: [],
            suggestedMappings: [],
            recommendations: [],
          };
        }

        const prompt = skillAnalysisPrompt(skillsToAnalyze);

        const response = await aiService.generate(prompt, {
          temperature: 0.7,
          maxTokens: 2000,
        });

        if (response.error) {
          set.status = 500;
          return {
            message: `AI analysis failed: ${response.error}`,
            detectedSkills: [],
            suggestedMappings: [],
            recommendations: [],
          };
        }

        let analysisResult: Record<string, unknown> = {
          detectedSkills: [],
          suggestedMappings: [],
          recommendations: [],
        };

        try {
          const jsonMatch = response.content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            analysisResult = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
          } else {
            analysisResult.recommendations = [response.content];
          }
        } catch {
          analysisResult.recommendations = [response.content];
        }

        const autoCreate = body.autoCreateMappings || false;
        if (
          autoCreate &&
          analysisResult.suggestedMappings &&
          Array.isArray(analysisResult.suggestedMappings)
        ) {
          for (const suggestedMapping of analysisResult.suggestedMappings) {
            if (!isRecord(suggestedMapping)) {
              continue;
            }
            const gameExpression = asNonEmptyString(suggestedMapping.gameExpression);
            const transferableSkill = asNonEmptyString(suggestedMapping.transferableSkill);
            if (gameExpression && transferableSkill) {
              try {
                await skillMappingService.createMapping({
                  gameExpression,
                  transferableSkill,
                  industryApplications: normalizeStringArray(suggestedMapping.industryApplications),
                  evidence: [],
                  confidence:
                    typeof suggestedMapping.confidence === "number" &&
                    Number.isFinite(suggestedMapping.confidence)
                      ? Math.max(0, Math.min(100, Math.round(suggestedMapping.confidence)))
                      : 60,
                  category: normalizeCategory(suggestedMapping.category),
                  demandLevel: normalizeDemandLevel(suggestedMapping.demandLevel),
                  verified: false,
                  aiGenerated: true,
                });
              } catch (error) {
                console.error("Failed to auto-create mapping:", error);
              }
            }
          }
        }

        return {
          message: "AI skill analysis completed successfully",
          detectedSkills: normalizeStringArray(analysisResult.detectedSkills),
          suggestedMappings: Array.isArray(analysisResult.suggestedMappings)
            ? analysisResult.suggestedMappings.filter(isRecord)
            : [],
          recommendations: normalizeStringArray(analysisResult.recommendations),
          provider: response.provider,
        };
      } catch (error) {
        console.error("AI analysis error:", error);
        set.status = 500;
        return {
          message: `Error during AI analysis: ${error instanceof Error ? error.message : "Unknown error"}`,
          detectedSkills: [],
          suggestedMappings: [],
          recommendations: [],
        };
      }
    },
    {
      body: t.Object({
        gameExperience: t.Optional(t.Record(t.String(), t.Any())),
        resume: t.Optional(t.Record(t.String(), t.Any())),
        autoCreateMappings: t.Optional(t.Boolean()),
      }),
    },
  );
