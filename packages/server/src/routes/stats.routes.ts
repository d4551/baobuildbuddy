import { API_ENDPOINTS, toApiChildPath, toApiScopedPath } from "@bao/shared/constants/endpoints";
import { Elysia } from "elysia";
import { statisticsService } from "../services/statistics-service";

export const statsRoutes = new Elysia({
  prefix: toApiScopedPath(API_ENDPOINTS.statsBase),
  tags: ["Stats"],
})
  .get(toApiChildPath(API_ENDPOINTS.statsBase, API_ENDPOINTS.statsDashboard), async () => {
    return statisticsService.getDashboardStats();
  })
  .get(toApiChildPath(API_ENDPOINTS.statsBase, API_ENDPOINTS.statsWeekly), async () => {
    return statisticsService.getWeeklyActivity();
  })
  .get(toApiChildPath(API_ENDPOINTS.statsBase, API_ENDPOINTS.statsCareer), async () => {
    return statisticsService.getCareerProgress();
  });
