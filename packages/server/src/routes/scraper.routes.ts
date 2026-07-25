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
  HTTP_STATUS_OK,
} from "@bao/shared/constants/http";
import { settle } from "@bao/shared/utils/promise";
import { Elysia } from "elysia";
import { scraperService } from "../services/scraper-service";
import { openapiDetail } from "../utils/openapi-detail";
import { scraperOperationResponses, scraperPortalParamsSchema } from "./scraper-route-contracts";

const SCRAPER_BASE_PATH = API_ENDPOINTS.scraperBase;

export const scraperRoutes = new Elysia({
  prefix: toApiScopedPath(SCRAPER_BASE_PATH),
})
  .post(
    toApiChildPath(SCRAPER_BASE_PATH, API_ENDPOINTS.scraperStudios),
    {
      detail: openapiDetail(
        "Scraper",
        "Retrieve scraper resource for BaoBuildBuddy career automation.",
      ),
      response: scraperOperationResponses,
    },
    async ({ status }) => {
      const scrapeStudiosResult = await settle(scraperService.scrapeStudios());
      if (scrapeStudiosResult.status === "rejected") {
        return status(HTTP_STATUS_INTERNAL_SERVER_ERROR, {
          error: API_ERROR_SCRAPE_STUDIOS_FAILED,
          details:
            scrapeStudiosResult.reason instanceof Error
              ? scrapeStudiosResult.reason.message
              : API_ERROR_UNKNOWN,
        });
      }
      return status(HTTP_STATUS_OK, scrapeStudiosResult.value);
    },
  )
  .post(
    toApiChildPath(SCRAPER_BASE_PATH, `${API_ENDPOINTS.scraperJobsBase}/:portalId`),
    {
      detail: openapiDetail(
        "Scraper",
        "Retrieve scraper resource for BaoBuildBuddy career automation.",
      ),
      params: scraperPortalParamsSchema,
      response: scraperOperationResponses,
    },
    async ({ params, status }) => {
      const portalId = params.portalId.trim();
      if (!isAutomationScrapePortalId(portalId)) {
        return status(HTTP_STATUS_BAD_REQUEST, {
          error: API_ERROR_SCRAPE_JOBS_FAILED,
          details: `Unsupported scraper portal: ${params.portalId}`,
        });
      }

      const scrapeJobsResult = await settle(scraperService.scrapeJobsForPortal(portalId));
      if (scrapeJobsResult.status === "rejected") {
        return status(HTTP_STATUS_INTERNAL_SERVER_ERROR, {
          error: API_ERROR_SCRAPE_JOBS_FAILED,
          details:
            scrapeJobsResult.reason instanceof Error
              ? scrapeJobsResult.reason.message
              : API_ERROR_UNKNOWN,
        });
      }
      return status(HTTP_STATUS_OK, scrapeJobsResult.value);
    },
  );
