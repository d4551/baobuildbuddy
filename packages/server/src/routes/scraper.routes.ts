import {
  API_ERROR_SCRAPE_JOBS_FAILED,
  API_ERROR_SCRAPE_STUDIOS_FAILED,
  API_ERROR_UNKNOWN,
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  isAutomationScrapePortalId,
  settle,
} from "@bao/shared";
import { StandardSchemaV1 } from "baobox";
import Type from "baobox";
import { Elysia } from "elysia";
import { scraperService } from "../services/scraper-service";

export const scraperRoutes = new Elysia({ prefix: "/scraper", tags: ["Scraper"] })
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
  .post(
    "/jobs/:portalId",
    async ({ params, set }) => {
      const portalId = params.portalId.trim();
      if (!isAutomationScrapePortalId(portalId)) {
        set.status = HTTP_STATUS_BAD_REQUEST;
        return {
          error: API_ERROR_SCRAPE_JOBS_FAILED,
          details: `Unsupported scraper portal: ${params.portalId}`,
        };
      }

      const scrapeJobsResult = await settle(scraperService.scrapeJobsForPortal(portalId));
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
    },
    {
      params: StandardSchemaV1(
        Type.Object(
          {
            portalId: Type.String({ minLength: 1 }),
          },
          { required: ["portalId"] },
        ),
      ),
    },
  );
