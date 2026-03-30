import { status } from "elysia";
import { Elysia } from "elysia";
import { skillMappingService } from "../services/skill-mapping-service";
import { skillAnalysisRateLimit } from "../utils/rate-limit";
import {
  skillAnalysisBodySchema,
  skillMappingCreateBodySchema,
  skillMappingIdParamsSchema,
  skillMappingsQuerySchema,
  skillMappingUpdateBodySchema,
  skillReadinessQuerySchema,
} from "./skill-mapping-route-contracts";
import {
  createSkillMappingFromBody,
  deleteSkillMappingById,
  getSkillReadiness,
  listSkillMappings,
  updateSkillMappingFromBody,
} from "./skill-mapping-route-support";
import { analyzeSkillMappingsSafely } from "./skill-mapping-route-analysis";

export const skillMappingRoutes = new Elysia({ prefix: "/skills", tags: ["Skill Mapping"] })
  .use(skillAnalysisRateLimit)
  .get("/mappings", async ({ query }) => listSkillMappings(query), {
    query: skillMappingsQuerySchema,
  })
  .post(
    "/mappings",
    async ({ body, set }) => {
      const result = await createSkillMappingFromBody(body);
      set.status = result.statusCode;
      return result.mapping;
    },
    { body: skillMappingCreateBodySchema },
  )
  .put(
    "/mappings/:id",
    async ({ params, body, set }) => updateSkillMappingFromBody(params.id, body, set),
    {
      params: skillMappingIdParamsSchema,
      body: skillMappingUpdateBodySchema,
    },
  )
  .delete(
    "/mappings/:id",
    async ({ params, set }) => {
      const result = await deleteSkillMappingById(params.id, set);
      if (result.kind === "gone" || result.kind === "deleted") {
        return status(result.statusCode, result.payload);
      }
      return result.payload;
    },
    { params: skillMappingIdParamsSchema },
  )
  .get("/pathways", async () => skillMappingService.getPathways())
  .get("/readiness", async ({ query }) => getSkillReadiness(query?.jobId), {
    query: skillReadinessQuerySchema,
  })
  .post("/ai-analyze", async ({ body, set }) => analyzeSkillMappingsSafely(body, set), {
    body: skillAnalysisBodySchema,
  });
