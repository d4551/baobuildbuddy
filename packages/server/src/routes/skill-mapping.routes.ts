import type { SkillCategory } from "@bao/shared";
import { desc } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { Elysia, status, t } from "elysia";
import { db } from "../db/client";
import { settings } from "../db/schema/settings";
import { skillMappings } from "../db/schema/skill-mappings";
import { AIService } from "../services/ai/ai-service";
import { skillAnalysisPrompt } from "../services/ai/prompts";
import { skillMappingService } from "../services/skill-mapping-service";

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
      const newMapping = await skillMappingService.createMapping({
        gameExpression: body.gameExpression,
        transferableSkill: body.transferableSkill,
        industryApplications: body.industryApplications || [],
        evidence: body.evidence || [],
        confidence: body.confidence || 50,
        category: (body.category as SkillCategory) || "technical",
        demandLevel: body.demandLevel || "medium",
        aiGenerated: body.aiGenerated || false,
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
        industryApplications: body.industryApplications,
        evidence: body.evidence,
        confidence: body.confidence,
        category: body.category as SkillCategory | undefined,
        demandLevel: body.demandLevel as "high" | "medium" | "low" | undefined,
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
          const exp = body.gameExperience as Record<string, unknown>;
          if (exp.skills && Array.isArray(exp.skills)) {
            skillsToAnalyze.push(...exp.skills);
          }
          if (exp.achievements && Array.isArray(exp.achievements)) {
            skillsToAnalyze.push(...exp.achievements);
          }
          if (exp.roles && Array.isArray(exp.roles)) {
            skillsToAnalyze.push(...exp.roles);
          }
        }

        if (body.resume) {
          const resume = body.resume as Record<string, unknown>;
          if (resume.skills && Array.isArray(resume.skills)) {
            skillsToAnalyze.push(...resume.skills);
          }
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
          for (const mapping of analysisResult.suggestedMappings as Array<{
            gameExpression: string;
            transferableSkill: string;
            industryApplications?: string[];
            confidence?: number;
            category?: SkillCategory;
            demandLevel?: "high" | "medium" | "low";
          }>) {
            if (mapping.gameExpression && mapping.transferableSkill) {
              try {
                await skillMappingService.createMapping({
                  gameExpression: mapping.gameExpression,
                  transferableSkill: mapping.transferableSkill,
                  industryApplications: mapping.industryApplications || [],
                  evidence: [],
                  confidence: mapping.confidence || 60,
                  category: mapping.category || "technical",
                  demandLevel: mapping.demandLevel || "medium",
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
          detectedSkills: (analysisResult.detectedSkills as string[]) || [],
          suggestedMappings:
            (analysisResult.suggestedMappings as Array<Record<string, unknown>>) || [],
          recommendations: (analysisResult.recommendations as string[]) || [],
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
