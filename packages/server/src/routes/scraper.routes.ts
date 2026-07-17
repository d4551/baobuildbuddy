import {
  API_ERROR_SCRAPE_JOBS_FAILED,
  API_ERROR_SCRAPE_STUDIOS_FAILED,
  API_ERROR_UNKNOWN,
} from "@bao/shared/constants/api-errors";
import { isAutomationScrapePortalId } from "@bao/shared/constants/automation";
import { API_ENDPOINTS, toApiChildPath, toApiScopedPath } from "@bao/shared/constants/endpoints";
import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
} from "@bao/shared/constants/http";
import { settle } from "@bao/shared/utils/promise";
import { StandardSchemaV1 } from "baobox";
import { Elysia } from "elysia";
import { scraperService } from "../services/scraper-service";
import type { RouteSetState } from "../types/route-state";
import { type ScraperPortalParams, scraperPortalParamsSchema } from "./scraper-route-contracts";

const SCRAPER_BASE_PATH = API_ENDPOINTS.scraperBase;

export const scraperRoutes = new Elysia({
  prefix: toApiScopedPath(SCRAPER_BASE_PATH),
  tags: ["Scraper"],
})
  .post(toApiChildPath(SCRAPER_BASE_PATH, API_ENDPOINTS.scraperStudios), async ({ set }) => {
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
    toApiChildPath(SCRAPER_BASE_PATH, `${API_ENDPOINTS.scraperJobsBase}/:portalId`),
    {
      params: StandardSchemaV1(scraperPortalParamsSchema),
    }, async ({ params, set }: { params: ScraperPortalParams; set: RouteSetState }) => {
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
  );
