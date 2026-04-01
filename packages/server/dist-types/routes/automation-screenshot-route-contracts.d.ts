import { StandardSchemaV1 } from "baobox";
import Type, { type StaticParse } from "baobox";
export type RouteSetState = {
    status?: number | string;
};
export declare const automationScreenshotParamsSchema: Type.TObject<{
    readonly runId: Type.TString;
    readonly index: Type.TString;
}, "index" | "runId", never>;
export type AutomationScreenshotParams = StaticParse<typeof automationScreenshotParamsSchema>;
export declare const automationScreenshotParams: Type.TObject<{
    readonly runId: Type.TString;
    readonly index: Type.TString;
}, "index" | "runId", never> & StandardSchemaV1<unknown, {
    index: string;
    runId: string;
} & {}>;
