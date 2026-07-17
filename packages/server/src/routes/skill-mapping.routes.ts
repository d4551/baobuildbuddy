import { Elysia, type status } from "elysia";
import {
  API_ERROR_SKILL_MAPPING_ALREADY_DELETED,
  API_ERROR_SKILL_MAPPING_NOT_FOUND,
} from "@bao/shared/constants/api-errors";
import { API_MESSAGE_SKILL_MAPPING_DELETED } from "@bao/shared/constants/api-messages";
import { API_ENDPOINTS, toApiScopedPath } from "@bao/shared/constants/endpoints";
import {
  HTTP_STATUS_CREATED,
  HTTP_STATUS_GONE,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
} from "@bao/shared/constants/http";
import { skillMappingService } from "../services/skill-mapping-service";
import { skillAnalysisRateLimit } from "../utils/rate-limit";
import { analyzeSkillMappingsSafely } from "./skill-mapping-route-analysis";
import {
  type SkillMappingIdParams,
  type SkillMappingRouteSetState,
  skillAnalysisBodySchema,
  skillAnalysisResponses,
  skillMappingCreateBodySchema,
  skillMappingCreateResponses,
  skillMappingDeleteResponses,
  skillMappingIdParamsSchema,
  skillMappingUpdateResponses,
  skillMappingsQuerySchema,
  skillMappingsListResponses,
  skillMappingUpdateBodySchema,
  skillReadinessQuerySchema,
  skillPathwaysResponses,
  skillReadinessResponses,
} from "./skill-mapping-route-contracts";
import {
  createSkillMappingFromBody,
  deleteSkillMappingById,
  getSkillReadiness,
  listSkillMappings,
  updateSkillMappingFromBody,
} from "./skill-mapping-route-support";

type RouteStatus = typeof status;

export const skillMappingRoutes = new Elysia({
  prefix: toApiScopedPath(API_ENDPOINTS.skillsBase),
})
  .use(skillAnalysisRateLimit)
  .get(
    "/mappings",
    {
      detail: { tags: ["Skill Mapping"] },
      query: skillMappingsQuerySchema,
      response: skillMappingsListResponses,
    },
    async ({ query, status }) => status(HTTP_STATUS_OK, await listSkillMappings(query)),
  )
  .post(
    "/mappings",
    {
      detail: { tags: ["Skill Mapping"] },
      body: skillMappingCreateBodySchema,
      response: skillMappingCreateResponses,
    },
    async ({ body, status }) => {
      const result = await createSkillMappingFromBody(body);
      return status(HTTP_STATUS_CREATED, result.mapping);
    },
  )
  .put(
    "/mappings/:id",
    {
      detail: { tags: ["Skill Mapping"] },
      params: skillMappingIdParamsSchema,
      body: skillMappingUpdateBodySchema,
      response: skillMappingUpdateResponses,
    },
    async ({ params, body, status }) => {
      const state: SkillMappingRouteSetState = {};
      const result = await updateSkillMappingFromBody(params.id, body, state);
      if ("error" in result) {
        return status(HTTP_STATUS_NOT_FOUND, result);
      }
      return status(HTTP_STATUS_OK, result);
    },
  )
  .delete(
    "/mappings/:id",
    {
      detail: { tags: ["Skill Mapping"] },
      params: skillMappingIdParamsSchema,
      response: skillMappingDeleteResponses,
    },
    async ({ params, status }: { params: SkillMappingIdParams; status: RouteStatus }) => {
      const state: SkillMappingRouteSetState = {};
      const result = await deleteSkillMappingById(params.id, state);
      if (result.kind === "not-found") {
        return status(HTTP_STATUS_NOT_FOUND, { error: API_ERROR_SKILL_MAPPING_NOT_FOUND });
      }
      if (result.kind === "gone") {
        return status(HTTP_STATUS_GONE, {
          error: API_ERROR_SKILL_MAPPING_ALREADY_DELETED,
          id: params.id,
        });
      }
      return status(HTTP_STATUS_OK, { message: API_MESSAGE_SKILL_MAPPING_DELETED, id: params.id });
    },
  )
  .get(
    "/pathways",
    {
      detail: { tags: ["Skill Mapping"] },
      response: skillPathwaysResponses,
    },
    async ({ status }) => status(HTTP_STATUS_OK, await skillMappingService.getPathways()),
  )
  .get(
    "/readiness",
    {
      detail: { tags: ["Skill Mapping"] },
      query: skillReadinessQuerySchema,
      response: skillReadinessResponses,
    },
    async ({ query, status }) => status(HTTP_STATUS_OK, await getSkillReadiness(query.jobId)),
  )
  .post(
    "/ai-analyze",
    {
      detail: { tags: ["Skill Mapping"] },
      body: skillAnalysisBodySchema,
      response: skillAnalysisResponses,
    },
    async ({ body, status }) => {
      const state: SkillMappingRouteSetState = {};
      const result = await analyzeSkillMappingsSafely(body, state);
      if (state.status === HTTP_STATUS_INTERNAL_SERVER_ERROR) {
        return status(HTTP_STATUS_INTERNAL_SERVER_ERROR, result);
      }
      return status(HTTP_STATUS_OK, result);
    },
  );
