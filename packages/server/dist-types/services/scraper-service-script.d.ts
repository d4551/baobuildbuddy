import { type AutomationScriptId, type ScrapedJob, type ScrapedStudio } from "@bao/shared/schemas/automation-scripts.schema";
import type { JobSearchResult } from "@bao/shared/types/jobs";
import type { AutomationScriptReference, ScraperScriptExecutionResult, ScriptExecutionOptions, ScriptInputPayload, ScriptReferenceOverride, ScriptRows } from "./scraper-service-contracts";
export declare const resolveScrapedContentHash: (row: ScrapedJob) => string;
export declare const toJobSearchResult: (rows: ScrapedJob[]) => JobSearchResult;
export declare const resolveScriptReference: (scriptReference: AutomationScriptId | ScriptReferenceOverride) => AutomationScriptReference;
export declare const runScraperScript: (scriptReference: AutomationScriptReference, payload?: ScriptInputPayload, options?: ScriptExecutionOptions) => Promise<ScraperScriptExecutionResult>;
export declare const parseStudioRows: <T>(raw: T) => ScriptRows<ScrapedStudio>;
export declare const parseJobRows: <T>(raw: T) => ScriptRows<ScrapedJob>;
