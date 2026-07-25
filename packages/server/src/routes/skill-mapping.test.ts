import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { API_ENDPOINT_PREFIX, API_ENDPOINTS } from "@bao/shared/constants/endpoints";
import { HTTP_STATUS_CREATED, HTTP_STATUS_OK } from "@bao/shared/constants/http";
import {
  SKILL_READINESS_FEEDBACK_IDS,
  SKILL_READINESS_IMPROVEMENT_IDS,
  SKILL_READINESS_NEXT_STEP_IDS,
  type SkillReadinessFeedbackId,
  type SkillReadinessImprovementId,
  type SkillReadinessNextStepId,
} from "@bao/shared/types/skill-mapping";
import { requestJson } from "../test-utils";

let app: { handle: (request: Request) => Response | Promise<Response> };
const SKILL_MAPPINGS_ROUTE = API_ENDPOINTS.skillMappings;

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

  app = new Elysia({ prefix: API_ENDPOINT_PREFIX }).use(routesModule.skillMappingRoutes);
});

afterAll(() => undefined);

const createSkillMapping = async (): Promise<string> => {
  const res = await requestJson<{ id: string }>(app, "POST", SKILL_MAPPINGS_ROUTE, {
    gameExpression: "Optimized rendering pipeline",
    transferableSkill: "Performance optimization",
    category: "technical",
  });
  expect(res.status).toBe(HTTP_STATUS_CREATED);
  return res.body.id;
};

describe("skill-mapping list routes", () => {
  test("GET skill mappings returns list", async () => {
    const res = await requestJson<unknown[]>(app, "GET", SKILL_MAPPINGS_ROUTE);
    expect(res.status).toBe(HTTP_STATUS_OK);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("GET skill mappings category filters", async () => {
    const res = await requestJson<unknown[]>(
      app,
      "GET",
      buildSkillMappingsCategoryPath("technical"),
    );
    expect(res.status).toBe(HTTP_STATUS_OK);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("skill-mapping readiness route", () => {
  test("GET skill readiness returns typed readiness ids", async () => {
    const res = await requestJson<{
      categories: {
        technical: { feedbackId: SkillReadinessFeedbackId };
        softSkills: { feedbackId: SkillReadinessFeedbackId };
        industryKnowledge: { feedbackId: SkillReadinessFeedbackId };
        portfolio: { feedbackId: SkillReadinessFeedbackId };
      };
      improvementSuggestions: SkillReadinessImprovementId[];
      nextSteps: SkillReadinessNextStepId[];
    }>(app, "GET", API_ENDPOINTS.skillReadiness);

    expect(res.status).toBe(HTTP_STATUS_OK);
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
  test("POST skill mappings creates mapping", async () => {
    const res = await requestJson<{
      id: string;
      gameExpression: string;
      transferableSkill: string;
    }>(app, "POST", SKILL_MAPPINGS_ROUTE, {
      gameExpression: "Optimized rendering pipeline",
      transferableSkill: "Performance optimization",
      category: "technical",
    });
    expect(res.status).toBe(HTTP_STATUS_CREATED);
    expect(res.body.gameExpression).toBe("Optimized rendering pipeline");
    expect(res.body.transferableSkill).toBe("Performance optimization");
    expect(res.body.id).toBeDefined();
  });

  test("PUT skill mapping detail updates", async () => {
    const mappingId = await createSkillMapping();
    const res = await requestJson<{ transferableSkill: string }>(
      app,
      "PUT",
      `${SKILL_MAPPINGS_ROUTE}/${mappingId}`,
      { transferableSkill: "System performance tuning" },
    );
    expect(res.status).toBe(HTTP_STATUS_OK);
    expect(res.body.transferableSkill).toBe("System performance tuning");
  });

  test("DELETE skill mapping detail removes", async () => {
    const mappingId = await createSkillMapping();
    const res = await requestJson<{ message: string; id: string }>(
      app,
      "DELETE",
      `${SKILL_MAPPINGS_ROUTE}/${mappingId}`,
    );
    expect(res.status).toBe(HTTP_STATUS_OK);
    expect(res.body.message).toBe("Skill mapping deleted");
    expect(res.body.id).toBe(mappingId);
  });
});
