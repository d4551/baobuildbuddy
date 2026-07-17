import { API_ENDPOINTS, toApiChildPath, toApiScopedPath } from "@bao/shared/constants/endpoints";
import { Elysia } from "elysia";
import { statisticsService } from "../services/statistics-service";

export const statsRoutes = new Elysia({
  prefix: toApiScopedPath(API_ENDPOINTS.statsBase),
})
  .get(toApiChildPath(API_ENDPOINTS.statsBase, API_ENDPOINTS.statsDashboard),{ detail: { tags: ["Stats"] } }, async () => {
    return statisticsService.getDashboardStats();
  })
  .get(toApiChildPath(API_ENDPOINTS.statsBase, API_ENDPOINTS.statsWeekly),{ detail: { tags: ["Stats"] } }, async () => {
    return statisticsService.getWeeklyActivity();
  })
  .get(toApiChildPath(API_ENDPOINTS.statsBase, API_ENDPOINTS.statsCareer),{ detail: { tags: ["Stats"] } }, async () => {
    return statisticsService.getCareerProgress();
  });
