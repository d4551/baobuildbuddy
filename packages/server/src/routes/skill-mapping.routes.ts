import { API_ENDPOINTS, toApiScopedPath } from "@bao/shared/constants/endpoints";
import { StandardSchemaV1 } from "baobox";
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

export const skillMappingRoutes = new Elysia({
  prefix: toApiScopedPath(API_ENDPOINTS.skillsBase),
  tags: ["Skill Mapping"],
})
  .use(skillAnalysisRateLimit)
  .get("/mappings", async ({ query }) => listSkillMappings(query), {
    query: StandardSchemaV1(skillMappingsQuerySchema),
  })
  .post(
    "/mappings",
    async ({ body, set }) => {
      const result = await createSkillMappingFromBody(body);
      set.status = result.statusCode;
      return result.mapping;
    },
    { body: StandardSchemaV1(skillMappingCreateBodySchema) },
  )
  .put(
    "/mappings/:id",
    async ({ params, body, set }) => updateSkillMappingFromBody(params.id, body, set),
    {
      params: StandardSchemaV1(skillMappingIdParamsSchema),
      body: StandardSchemaV1(skillMappingUpdateBodySchema),
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
    { params: StandardSchemaV1(skillMappingIdParamsSchema) },
  )
  .get("/pathways", async () => skillMappingService.getPathways())
  .get("/readiness", async ({ query }) => getSkillReadiness(query.jobId), {
    query: StandardSchemaV1(skillReadinessQuerySchema),
  })
  .post("/ai-analyze", async ({ body, set }) => analyzeSkillMappingsSafely(body, set), {
    body: StandardSchemaV1(skillAnalysisBodySchema),
  });
