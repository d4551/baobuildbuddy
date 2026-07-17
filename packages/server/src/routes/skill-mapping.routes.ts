import { Elysia, status } from "elysia";
import { API_ENDPOINTS, toApiScopedPath } from "@bao/shared/constants/endpoints";
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
})
  .use(skillAnalysisRateLimit)
  .get(
    "/mappings",
    {
      detail: { tags: ["Skill Mapping"] },
      query: skillMappingsQuerySchema,
      },
    async ({ query }: { query: SkillMappingsRouteQuery }) => listSkillMappings(query),
  )
  .post(
    "/mappings",
    {
      detail: { tags: ["Skill Mapping"] },
      body: skillMappingCreateBodySchema,
      },
    async ({
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
      detail: { tags: ["Skill Mapping"] },
      params: skillMappingIdParamsSchema,
      body: skillMappingUpdateBodySchema,
      },
    async ({
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
    {
      detail: { tags: ["Skill Mapping"] },
      params: skillMappingIdParamsSchema,
      },
    async ({ params, set }: { params: SkillMappingIdParams; set: SkillMappingRouteSetState }) => {
      const result = await deleteSkillMappingById(params.id, set);
      if (result.kind === "gone" || result.kind === "deleted") {
        return status(result.statusCode, result.payload);
      }
      return result.payload;
    },
  )
  .get(
    "/pathways",
    {
      detail: { tags: ["Skill Mapping"] },
      },
    async () => skillMappingService.getPathways(),
  )
  .get(
    "/readiness",
    {
      detail: { tags: ["Skill Mapping"] },
      query: skillReadinessQuerySchema,
      },
    async ({ query }: { query: SkillReadinessRouteQuery }) => getSkillReadiness(query.jobId),
  )
  .post(
    "/ai-analyze",
    {
      detail: { tags: ["Skill Mapping"] },
      body: skillAnalysisBodySchema,
      },
    async ({ body, set }: { body: SkillAnalysisRouteBody; set: SkillMappingRouteSetState }) =>
      analyzeSkillMappingsSafely(body, set),
  );
