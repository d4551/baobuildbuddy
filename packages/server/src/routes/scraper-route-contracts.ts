import type { Static } from "typebox";
import { t } from "elysia";

export const scraperPortalParamsSchema = t.Object(
  {
    portalId: t.String({ minLength: 1 }),
  },
  { required: ["portalId"] },
);

export type ScraperPortalParams = Static<typeof scraperPortalParamsSchema>;
