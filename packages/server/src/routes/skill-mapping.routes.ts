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
import { Elysia } from "elysia";
import { skillMappingService } from "../services/skill-mapping-service";
import { openapiDetail } from "../utils/openapi-detail";
import { skillAnalysisRateLimit } from "../utils/rate-limit";
import { analyzeSkillMappingsSafely } from "./skill-mapping-route-analysis";
import {
  type SkillMappingRouteSetState,
  skillAnalysisBodySchema,
  skillAnalysisResponses,
  skillMappingCreateBodySchema,
  skillMappingCreateResponses,
  skillMappingDeleteResponses,
  skillMappingIdParamsSchema,
  skillMappingsListResponses,
  skillMappingsQuerySchema,
  skillMappingUpdateBodySchema,
  skillMappingUpdateResponses,
  skillPathwaysResponses,
  skillReadinessQuerySchema,
  skillReadinessResponses,
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
      detail: openapiDetail(
        "Skill Mapping",
        "List skill mappings between game and transferable skills.",
      ),
      query: skillMappingsQuerySchema,
      response: skillMappingsListResponses,
    },
    async ({ query, status }) => status(HTTP_STATUS_OK, await listSkillMappings(query)),
  )
  .post(
    "/mappings",
    {
      detail: openapiDetail(
        "Skill Mapping",
        "Create a skill mapping entry for career translation.",
      ),
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
      detail: openapiDetail(
        "Skill Mapping",
        "Replace an existing skill mapping entry by id.",
      ),
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
      detail: openapiDetail(
        "Skill Mapping",
        "Delete a skill mapping entry by id.",
      ),
      params: skillMappingIdParamsSchema,
      response: skillMappingDeleteResponses,
    },
    async ({ params, status }) => {
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
      detail: openapiDetail(
        "Skill Mapping",
        "Retrieve recommended skill pathways for target roles.",
      ),
      response: skillPathwaysResponses,
    },
    async ({ status }) => status(HTTP_STATUS_OK, await skillMappingService.getPathways()),
  )
  .get(
    "/readiness",
    {
      detail: openapiDetail(
        "Skill Mapping",
        "Retrieve skill readiness scores for target roles.",
      ),
      query: skillReadinessQuerySchema,
      response: skillReadinessResponses,
    },
    async ({ query, status }) => status(HTTP_STATUS_OK, await getSkillReadiness(query.jobId)),
  )
  .post(
    "/ai-analyze",
    {
      detail: openapiDetail(
        "Skill Mapping",
        "Analyze skills with AI and propose mapping updates.",
      ),
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
