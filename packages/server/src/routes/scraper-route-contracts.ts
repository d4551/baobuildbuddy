import type { Static } from "typebox";
import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_OK,
} from "@bao/shared/constants/http";
import { t } from "elysia";

export const scraperPortalParamsSchema = t.Object(
  {
    portalId: t.String({ minLength: 1 }),
  },
  { required: ["portalId"] },
);

export type ScraperPortalParams = Static<typeof scraperPortalParamsSchema>;

export const scrapeEnrichmentSummarySchema = t.Object({
  enabled: t.Boolean(),
  enrichedRecords: t.Number(),
  warnings: t.Array(t.String()),
  provider: t.Optional(t.String()),
  model: t.Optional(t.String()),
});

export const scraperOperationResultSchema = t.Object({
  scraped: t.Number(),
  upserted: t.Number(),
  errors: t.Array(t.String()),
  enrichment: scrapeEnrichmentSummarySchema,
});

export const scraperErrorResponseSchema = t.Object({
  error: t.String(),
  details: t.Optional(t.String()),
});

export const scraperOperationResponses = {
  [HTTP_STATUS_OK]: scraperOperationResultSchema,
  [HTTP_STATUS_BAD_REQUEST]: scraperErrorResponseSchema,
  [HTTP_STATUS_INTERNAL_SERVER_ERROR]: scraperErrorResponseSchema,
} as const;
