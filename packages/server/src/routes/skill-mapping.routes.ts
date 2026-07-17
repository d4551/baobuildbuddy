import { API_ENDPOINTS, toApiScopedPath } from "@bao/shared/constants/endpoints";
import { StandardSchemaV1 } from "baobox";
import { Elysia, status } from "elysia";
import { skillMappingService } from "../services/skill-mapping-service";
import { skillAnalysisRateLimit } from "../utils/rate-limit";
import { analyzeSkillMappingsSafely } from "./skill-mapping-route-analysis";
import {
  type SkillAnalysisRouteBody,
  type SkillMappingCreateRouteBody,
  type SkillMappingIdParams,
  type SkillMappingRouteSetState,
  type SkillMappingsRouteQuery,
  type SkillMappingUpdateRouteBody,
  type SkillReadinessRouteQuery,
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

export const skillMappingRoutes = new Elysia({
  prefix: toApiScopedPath(API_ENDPOINTS.skillsBase),
  tags: ["Skill Mapping"],
})
  .use(skillAnalysisRateLimit)
  .get(
    "/mappings",
    {
      query: StandardSchemaV1(skillMappingsQuerySchema),
    }, async ({ query }: { query: SkillMappingsRouteQuery }) => listSkillMappings(query),
  )
  .post(
    "/mappings",
    { body: StandardSchemaV1(skillMappingCreateBodySchema) }, async ({
      body,
      set,
    }: {
      body: SkillMappingCreateRouteBody;
      set: SkillMappingRouteSetState;
    }) => {
      const result = await createSkillMappingFromBody(body);
      set.status = result.statusCode;
      return result.mapping;
    },
  )
  .put(
    "/mappings/:id",
    {
      params: StandardSchemaV1(skillMappingIdParamsSchema),
      body: StandardSchemaV1(skillMappingUpdateBodySchema),
    }, async ({
      params,
      body,
      set,
    }: {
      params: SkillMappingIdParams;
      body: SkillMappingUpdateRouteBody;
      set: SkillMappingRouteSetState;
    }) => updateSkillMappingFromBody(params.id, body, set),
  )
  .delete(
    "/mappings/:id",
    { params: StandardSchemaV1(skillMappingIdParamsSchema) }, async ({ params, set }: { params: SkillMappingIdParams; set: SkillMappingRouteSetState }) => {
      const result = await deleteSkillMappingById(params.id, set);
      if (result.kind === "gone" || result.kind === "deleted") {
        return status(result.statusCode, result.payload);
      }
      return result.payload;
    },
  )
  .get("/pathways", async () => skillMappingService.getPathways())
  .get(
    "/readiness",
    {
      query: StandardSchemaV1(skillReadinessQuerySchema),
    }, async ({ query }: { query: SkillReadinessRouteQuery }) => getSkillReadiness(query.jobId),
  )
  .post(
    "/ai-analyze",
    {
      body: StandardSchemaV1(skillAnalysisBodySchema),
    }, async ({ body, set }: { body: SkillAnalysisRouteBody; set: SkillMappingRouteSetState }) =>
      analyzeSkillMappingsSafely(body, set),
  );
