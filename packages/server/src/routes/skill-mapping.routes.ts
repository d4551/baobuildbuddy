import { generateId } from "@bao/shared";
import { desc, eq, like } from "drizzle-orm";
import { Elysia, t } from "elysia";
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
        results = results.filter(
          (m) =>
            m.gameExpression?.toLowerCase().includes(search.toLowerCase()) ||
            m.transferableSkill?.toLowerCase().includes(search.toLowerCase()),
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
      const newMapping = {
        id: generateId(),
        gameExpression: body.gameExpression,
        transferableSkill: body.transferableSkill,
        industryApplications: body.industryApplications || [],
        evidence: body.evidence || [],
        confidence: body.confidence || 50,
        category: body.category || null,
        demandLevel: body.demandLevel || "medium",
        aiGenerated: body.aiGenerated || false,
      };

      await db.insert(skillMappings).values(newMapping);
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
      const existing = await db.select().from(skillMappings).where(eq(skillMappings.id, params.id));
      if (existing.length === 0) {
        set.status = 404;
        return { error: "Skill mapping not found" };
      }

      const updates: Record<string, unknown> = {
        updatedAt: new Date().toISOString(),
      };

      if (body.gameExpression !== undefined) updates.gameExpression = body.gameExpression;
      if (body.transferableSkill !== undefined) updates.transferableSkill = body.transferableSkill;
      if (body.industryApplications !== undefined)
        updates.industryApplications = body.industryApplications;
      if (body.evidence !== undefined) updates.evidence = body.evidence;
      if (body.confidence !== undefined) updates.confidence = body.confidence;
      if (body.category !== undefined) updates.category = body.category;
      if (body.demandLevel !== undefined) updates.demandLevel = body.demandLevel;

      await db.update(skillMappings).set(updates).where(eq(skillMappings.id, params.id));

      const updated = await db.select().from(skillMappings).where(eq(skillMappings.id, params.id));
      return updated[0];
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

      await db.delete(skillMappings).where(eq(skillMappings.id, params.id));
      return { message: "Skill mapping deleted", id: params.id };
    },
    {
      params: t.Object({ id: t.String({ maxLength: 100 }) }),
    },
  )
  .get("/pathways", async () => {
    const mappings = await db.select().from(skillMappings);

    // Group by category
    const pathways: Record<string, unknown[]> = {};
    for (const m of mappings) {
      const cat = m.category || "general";
      if (!pathways[cat]) pathways[cat] = [];
      pathways[cat].push({
        gameExpression: m.gameExpression,
        transferableSkill: m.transferableSkill,
        demandLevel: m.demandLevel,
      });
    }

    return {
      pathways: Object.entries(pathways).map(([category, skills]) => ({
        category,
        skills,
        count: skills.length,
      })),
      totalMappings: mappings.length,
    };
  })
  .get("/readiness", async () => {
    // Stub: Career readiness assessment
    const mappings = await db.select().from(skillMappings);

    const highConfidence = mappings.filter((m) => (m.confidence || 0) >= 70).length;
    const mediumConfidence = mappings.filter(
      (m) => (m.confidence || 0) >= 40 && (m.confidence || 0) < 70,
    ).length;
    const lowConfidence = mappings.filter((m) => (m.confidence || 0) < 40).length;

    const highDemand = mappings.filter((m) => m.demandLevel === "high").length;
    const mediumDemand = mappings.filter((m) => m.demandLevel === "medium").length;
    const lowDemand = mappings.filter((m) => m.demandLevel === "low").length;

    return {
      totalSkills: mappings.length,
      confidenceBreakdown: {
        high: highConfidence,
        medium: mediumConfidence,
        low: lowConfidence,
      },
      demandBreakdown: {
        high: highDemand,
        medium: mediumDemand,
        low: lowDemand,
      },
      readinessScore:
        mappings.length > 0
          ? Math.round(
              ((highConfidence * 1.0 + mediumConfidence * 0.5 + lowConfidence * 0.25) /
                mappings.length) *
                100,
            )
          : 0,
    };
  })
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

        let analysisResult: unknown = {
          detectedSkills: [],
          suggestedMappings: [],
          recommendations: [],
        };

        try {
          const jsonMatch = response.content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            analysisResult = JSON.parse(jsonMatch[0]);
          } else {
            analysisResult.recommendations = [response.content];
          }
        } catch (parseError) {
          analysisResult.recommendations = [response.content];
        }

        const autoCreate = body.autoCreateMappings || false;
        if (
          autoCreate &&
          analysisResult.suggestedMappings &&
          Array.isArray(analysisResult.suggestedMappings)
        ) {
          for (const mapping of analysisResult.suggestedMappings) {
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
          detectedSkills: analysisResult.detectedSkills || [],
          suggestedMappings: analysisResult.suggestedMappings || [],
          recommendations: analysisResult.recommendations || [],
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
