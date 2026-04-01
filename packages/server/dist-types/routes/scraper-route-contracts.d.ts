import Type, { type StaticParse } from "baobox";
export type RouteSetState = {
    status?: number | string;
};
export declare const scraperPortalParamsSchema: Type.TObject<{
    readonly portalId: Type.TString;
}, "portalId", never>;
export type ScraperPortalParams = StaticParse<typeof scraperPortalParamsSchema>;
