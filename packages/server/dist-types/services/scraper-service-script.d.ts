import { type AutomationScriptId, type JobSearchResult, type ScrapedJob, type ScrapedStudio } from "@bao/shared";
import type { AutomationScriptReference, ScriptExecutionOptions, ScriptInputPayload, ScriptReferenceOverride, ScriptRows, ScraperScriptExecutionResult } from "./scraper-service-contracts";
export declare const resolveScrapedContentHash: (row: ScrapedJob) => string;
export declare const toJobSearchResult: (rows: ScrapedJob[]) => JobSearchResult;
export declare const resolveScriptReference: (scriptReference: AutomationScriptId | ScriptReferenceOverride) => AutomationScriptReference;
export declare const runScraperScript: (scriptReference: AutomationScriptReference, payload?: ScriptInputPayload, options?: ScriptExecutionOptions) => Promise<ScraperScriptExecutionResult>;
export declare const parseStudioRows: (raw: unknown) => ScriptRows<ScrapedStudio>;
export declare const parseJobRows: (raw: unknown) => ScriptRows<ScrapedJob>;
