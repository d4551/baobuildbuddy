import Type, { type StaticParse } from "baobox";

export type RouteSetState = {
  status?: number | string;
};

export const scraperPortalParamsSchema = Type.Object(
  {
    portalId: Type.String({ minLength: 1 }),
  },
  { required: ["portalId"] },
);

export type ScraperPortalParams = StaticParse<typeof scraperPortalParamsSchema>;
