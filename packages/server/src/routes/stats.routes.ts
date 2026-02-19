import { Elysia } from "elysia";
import { statisticsService } from "../services/statistics-service";

export const statsRoutes = new Elysia({ prefix: "/stats" })
  .get("/dashboard", async () => {
    return statisticsService.getDashboardStats();
  })
  .get("/weekly", async () => {
    return statisticsService.getWeeklyActivity();
  })
  .get("/career", async () => {
    return statisticsService.getCareerProgress();
  });
