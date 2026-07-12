import Type, { StandardSchemaV1, type StaticParse } from "baobox";
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
