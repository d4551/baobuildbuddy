import { Elysia } from "elysia";
import { scraperService } from "../services/scraper-service";

export const scraperRoutes = new Elysia({ prefix: "/scraper" })
  .post("/studios", async ({ set }) => {
    try {
      const result = await scraperService.scrapeStudios();
      return result;
    } catch (error) {
      set.status = 500;
      return {
        error: "Studio scrape failed",
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }
  })
  .post("/jobs/gamedev", async ({ set }) => {
    try {
      const result = await scraperService.scrapeGameDevNetJobs();
      return result;
    } catch (error) {
      set.status = 500;
      return {
        error: "Job scrape failed",
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });
