import { Elysia } from "elysia";
import { scraperService } from "../services/scraper-service";

export const scraperRoutes = new Elysia({ prefix: "/scraper" })
  .post("/studios", async ({ set }) => {
    const [scrapeStudiosResult] = await Promise.allSettled([scraperService.scrapeStudios()]);
    if (scrapeStudiosResult.status === "rejected") {
      set.status = 500;
      return {
        error: "Studio scrape failed",
        details:
          scrapeStudiosResult.reason instanceof Error
            ? scrapeStudiosResult.reason.message
            : "Unknown error",
      };
    }
    return scrapeStudiosResult.value;
  })
  .post("/jobs/gamedev", async ({ set }) => {
    const [scrapeJobsResult] = await Promise.allSettled([scraperService.scrapeGameDevNetJobs()]);
    if (scrapeJobsResult.status === "rejected") {
      set.status = 500;
      return {
        error: "Job scrape failed",
        details:
          scrapeJobsResult.reason instanceof Error
            ? scrapeJobsResult.reason.message
            : "Unknown error",
      };
    }
    return scrapeJobsResult.value;
  });
