import { API_ENDPOINTS, toApiChildPath, toApiScopedPath } from "@bao/shared/constants/endpoints";
import { HTTP_STATUS_OK } from "@bao/shared/constants/http";
import { Elysia } from "elysia";
import { statisticsService } from "../services/statistics-service";
import {
  statsCareerResponses,
  statsDashboardResponses,
  statsWeeklyResponses,
} from "./stats-route-contracts";
import { openapiDetail } from "../utils/openapi-detail";

export const statsRoutes = new Elysia({
  prefix: toApiScopedPath(API_ENDPOINTS.statsBase),
})
  .get(
    toApiChildPath(API_ENDPOINTS.statsBase, API_ENDPOINTS.statsDashboard),
    {
      detail: openapiDetail("Stats", "Retrieve stats resource for BaoBuildBuddy career automation."),
      response: statsDashboardResponses,
    },
    async ({ status }) => status(HTTP_STATUS_OK, await statisticsService.getDashboardStats()),
  )
  .get(
    toApiChildPath(API_ENDPOINTS.statsBase, API_ENDPOINTS.statsWeekly),
    {
      detail: openapiDetail("Stats", "Retrieve stats resource for BaoBuildBuddy career automation."),
      response: statsWeeklyResponses,
    },
    async ({ status }) => status(HTTP_STATUS_OK, await statisticsService.getWeeklyActivity()),
  )
  .get(
    toApiChildPath(API_ENDPOINTS.statsBase, API_ENDPOINTS.statsCareer),
    {
      detail: openapiDetail("Stats", "Retrieve stats resource for BaoBuildBuddy career automation."),
      response: statsCareerResponses,
    },
    async ({ status }) => status(HTTP_STATUS_OK, await statisticsService.getCareerProgress()),
  );
