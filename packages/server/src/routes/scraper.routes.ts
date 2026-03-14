import {
  API_ERROR_SCRAPE_JOBS_FAILED,
  API_ERROR_SCRAPE_STUDIOS_FAILED,
  API_ERROR_UNKNOWN,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  settle,
} from "@bao/shared";
import { Elysia } from "elysia";
import { scraperService } from "../services/scraper-service";

export const scraperRoutes = new Elysia({ prefix: "/scraper" })
  .post("/studios", async ({ set }) => {
    const scrapeStudiosResult = await settle(scraperService.scrapeStudios());
    if (scrapeStudiosResult.status === "rejected") {
      set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
      return {
        error: API_ERROR_SCRAPE_STUDIOS_FAILED,
        details:
          scrapeStudiosResult.reason instanceof Error
            ? scrapeStudiosResult.reason.message
            : API_ERROR_UNKNOWN,
      };
    }
    return scrapeStudiosResult.value;
  })
  .post("/jobs/hitmarker", async ({ set }) => {
    const scrapeJobsResult = await settle(scraperService.scrapeHitmarkerJobs());
    if (scrapeJobsResult.status === "rejected") {
      set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
      return {
        error: API_ERROR_SCRAPE_JOBS_FAILED,
        details:
          scrapeJobsResult.reason instanceof Error
            ? scrapeJobsResult.reason.message
            : API_ERROR_UNKNOWN,
      };
    }
    return scrapeJobsResult.value;
  });
