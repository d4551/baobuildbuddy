import type {
  AutomationScriptId,
  GamingPortalId,
  JobSearchResult,
  ScrapeEnrichmentRunSummary,
  ScrapePersonaEnrichment,
  ScrapedJob,
  ScrapedStudio,
} from "@bao/shared";
import { gamingPortalScraperScriptIdByPortalId } from "@bao/shared";

export type ScriptInputPayload = {
  sourceUrl?: string;
};

export type ScriptExecutionOptions = {
  timeoutMs?: number;
  signal?: AbortSignal;
};

export type ScriptRows<T> = {
  rows: T[];
  rowErrors: string[];
};

export type ScraperScriptExecutionResult =
  | {
      ok: true;
      parsed: unknown;
      stderrLines: string[];
    }
  | {
      ok: false;
      error: string;
      stderrLines: string[];
    };

export type AutomationScriptReference = {
  scriptId?: AutomationScriptId;
  scriptPath?: string;
};

export type ScriptReferenceOverride = {
  scriptPath: string;
};

export type ScrapeEnrichmentAttempt = {
  enrichment?: ScrapePersonaEnrichment;
  warning?: string;
  provider?: ScrapeEnrichmentRunSummary["provider"];
  model?: string;
};

export type ScrapeEnrichmentAccumulator = {
  enabled: boolean;
  enrichedRecords: number;
  warnings: string[];
  provider?: ScrapeEnrichmentRunSummary["provider"];
  model?: string;
};

export const STUDIO_SCRAPER_SCRIPT_ID: AutomationScriptId = "studio-scraper";
export const DEFAULT_JOB_POSTED_DATE = "";
export const DEFAULT_JOB_TYPE = "full-time";
export const DEFAULT_JOB_SOURCE = "unknown-source";
export const CONTENT_HASH_PREFIX = "job";
export const CONTENT_HASH_LENGTH = 24;
export const SCRAPE_ENRICHMENT_WARNING_LIMIT = 25;
export const PORTAL_SCRIPT_ID_BY_ID = {
  hitmarker: gamingPortalScraperScriptIdByPortalId.hitmarker,
  grackle: gamingPortalScraperScriptIdByPortalId.grackle,
  workwithindies: gamingPortalScraperScriptIdByPortalId.workwithindies,
  remotegamejobs: gamingPortalScraperScriptIdByPortalId.remotegamejobs,
  gamesjobsdirect: gamingPortalScraperScriptIdByPortalId.gamesjobsdirect,
  pocketgamer: gamingPortalScraperScriptIdByPortalId.pocketgamer,
} as const satisfies Record<GamingPortalId, AutomationScriptId>;

export type { JobSearchResult, ScrapedJob, ScrapedStudio };
