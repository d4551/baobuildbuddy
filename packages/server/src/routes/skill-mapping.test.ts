import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { SKILL_READINESS_FEEDBACK_IDS, SKILL_READINESS_IMPROVEMENT_IDS, SKILL_READINESS_NEXT_STEP_IDS, type SkillReadinessFeedbackId, type SkillReadinessImprovementId, type SkillReadinessNextStepId } from "@bao/shared/types/skill-mapping";
import { requestJson } from "../test-utils";

let app: { handle: (request: Request) => Response | Promise<Response> };
const SKILL_MAPPINGS_ROUTE = "/api/skills/mappings";

const buildSkillMappingsCategoryPath = (category: string): string => {
  const query = new URLSearchParams({ category });
  return `${SKILL_MAPPINGS_ROUTE}?${query.toString()}`;
};

beforeAll(async () => {
  const dbModule = await import("../db/client");
  const initModule = await import("../db/init");
  const seedModule = await import("../db/seed");
  const routesModule = await import("./skill-mapping.routes");
  const { Elysia } = await import("elysia");

  initModule.initializeDatabase(dbModule.sqlite);
  seedModule.seedDatabase(dbModule.db);

  app = new Elysia({ prefix: "/api" }).use(routesModule.skillMappingRoutes);
});

afterAll(() => {});

const createSkillMapping = async (): Promise<string> => {
  const res = await requestJson<{ id: string }>(app, "POST", SKILL_MAPPINGS_ROUTE, {
    gameExpression: "Optimized rendering pipeline",
    transferableSkill: "Performance optimization",
    category: "technical",
  });
  expect(res.status).toBe(201);
  return res.body.id;
};

describe("skill-mapping list routes", () => {
  test("GET /api/skills/mappings returns list", async () => {
    const res = await requestJson<unknown[]>(app, "GET", SKILL_MAPPINGS_ROUTE);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("GET /api/skills/mappings?category=technical filters", async () => {
    const res = await requestJson<unknown[]>(
      app,
      "GET",
      buildSkillMappingsCategoryPath("technical"),
    );
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("skill-mapping readiness route", () => {
  test("GET /api/skills/readiness returns typed readiness ids", async () => {
    const res = await requestJson<{
      categories: {
        technical: { feedbackId: SkillReadinessFeedbackId };
        softSkills: { feedbackId: SkillReadinessFeedbackId };
        industryKnowledge: { feedbackId: SkillReadinessFeedbackId };
        portfolio: { feedbackId: SkillReadinessFeedbackId };
      };
      improvementSuggestions: SkillReadinessImprovementId[];
      nextSteps: SkillReadinessNextStepId[];
    }>(app, "GET", "/api/skills/readiness");

    expect(res.status).toBe(200);
    expect(SKILL_READINESS_FEEDBACK_IDS).toContain(res.body.categories.technical.feedbackId);
    expect(SKILL_READINESS_FEEDBACK_IDS).toContain(res.body.categories.softSkills.feedbackId);
    expect(SKILL_READINESS_FEEDBACK_IDS).toContain(
      res.body.categories.industryKnowledge.feedbackId,
    );
    expect(SKILL_READINESS_FEEDBACK_IDS).toContain(res.body.categories.portfolio.feedbackId);

    for (const suggestion of res.body.improvementSuggestions) {
      expect(SKILL_READINESS_IMPROVEMENT_IDS).toContain(suggestion);
    }

    for (const nextStep of res.body.nextSteps) {
      expect(SKILL_READINESS_NEXT_STEP_IDS).toContain(nextStep);
    }
  });
});

describe("skill-mapping mutation routes", () => {
  test("POST /api/skills/mappings creates mapping", async () => {
    const res = await requestJson<{
      id: string;
      gameExpression: string;
      transferableSkill: string;
    }>(app, "POST", SKILL_MAPPINGS_ROUTE, {
      gameExpression: "Optimized rendering pipeline",
      transferableSkill: "Performance optimization",
      category: "technical",
    });
    expect(res.status).toBe(201);
    expect(res.body.gameExpression).toBe("Optimized rendering pipeline");
    expect(res.body.transferableSkill).toBe("Performance optimization");
    expect(res.body.id).toBeDefined();
  });

  test("PUT /api/skills/mappings/:id updates", async () => {
    const mappingId = await createSkillMapping();
    const res = await requestJson<{ transferableSkill: string }>(
      app,
      "PUT",
      `/api/skills/mappings/${mappingId}`,
      { transferableSkill: "System performance tuning" },
    );
    expect(res.status).toBe(200);
    expect(res.body.transferableSkill).toBe("System performance tuning");
  });

  test("DELETE /api/skills/mappings/:id removes", async () => {
    const mappingId = await createSkillMapping();
    const res = await requestJson<{ message: string; id: string }>(
      app,
      "DELETE",
      `/api/skills/mappings/${mappingId}`,
    );
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Skill mapping deleted");
    expect(res.body.id).toBe(mappingId);
  });
});
