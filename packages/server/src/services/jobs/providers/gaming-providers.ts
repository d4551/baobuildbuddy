import {
  type GamingPortalConfig,
  type GamingPortalId,
  generateId,
  safeParseJson,
  settle,
  toErrorMessage,
} from "@bao/shared";
import { createServerLogger } from "../../../utils/logger";
import { type ScrapedJob, scraperService } from "../../scraper-service";
import type { JobFilters, JobProvider, RawJob } from "./provider-interface";
import { loadJobProviderSettings } from "./provider-settings";

interface HitmarkerJob extends Record<string, unknown> {
  id?: string;
  title?: string;
  company?: string | { name?: string };
  location?: string;
  description?: string;
  url?: string;
  slug?: string;
  created_at?: string;
}

type HitmarkerResponse = HitmarkerJob[] | { jobs?: HitmarkerJob[]; data?: HitmarkerJob[] };

type PortalScrapeMethod = (sourceUrl?: string) => Promise<ScrapedJob[]>;

const WHITESPACE_PATTERN = /\s+/g;
const NON_HASH_SAFE_PATTERN = /[^a-z0-9-_]/g;
const REMOTE_LOCATION_PATTERN = /remote/i;

const PORTAL_SCRAPE_METHOD_BY_ID: Record<GamingPortalId, PortalScrapeMethod> = {
  hitmarker: () => scraperService.scrapeHitmarkerJobsRaw(),
  grackle: () => scraperService.scrapeGrackleJobsRaw(),
  workwithindies: () => scraperService.scrapeWorkWithIndiesJobsRaw(),
  remotegamejobs: () => scraperService.scrapeRemoteGameJobsRaw(),
  gamesjobsdirect: () => scraperService.scrapeGamesJobsDirectRaw(),
  pocketgamer: () => scraperService.scrapePocketGamerJobsRaw(),
};
const gamingProviderLogger = createServerLogger("gaming-providers");

const logProviderFailure = (providerName: string, reason: string, details?: unknown): RawJob[] => {
  gamingProviderLogger.error("Job provider fetch failed", {
    providerName,
    reason,
    details,
  });
  return [];
};

const logProviderSkip = (providerName: string, reason: string, details?: unknown): RawJob[] => {
  gamingProviderLogger.info("Job provider fetch skipped", {
    providerName,
    reason,
    details,
  });
  return [];
};

const resolveHitmarkerJobs = (payload: HitmarkerResponse): HitmarkerJob[] =>
  Array.isArray(payload) ? payload : (payload.jobs ?? payload.data ?? []);

const resolveCompanyName = (company: HitmarkerJob["company"], fallback: string): string => {
  if (typeof company === "string" && company.length > 0) {
    return company;
  }

  if (typeof company === "object" && company !== null && typeof company.name === "string") {
    return company.name;
  }

  return fallback;
};

const resolveHitmarkerContentHash = (job: HitmarkerJob): string => {
  const source = job.id ?? job.slug ?? job.url ?? job.title ?? generateId();
  const value = String(source)
    .trim()
    .toLowerCase()
    .replace(WHITESPACE_PATTERN, "-")
    .replace(NON_HASH_SAFE_PATTERN, "");

  return `hm-${value || generateId()}`;
};

const resolvePortalConfig = (
  portals: GamingPortalConfig[],
  portalId: GamingPortalId,
): GamingPortalConfig | null => portals.find((portal) => portal.id === portalId) ?? null;

/**
 * Provider for Hitmarker gaming jobs.
 */
export class HitmarkerProvider implements JobProvider {
  name = "Hitmarker";
  type = "gaming-board";
  enabled = true;

  async fetchJobs(filters?: JobFilters): Promise<RawJob[]> {
    const providerSettingsResult = await settle(loadJobProviderSettings());
    if (providerSettingsResult.status === "rejected") {
      return logProviderFailure(this.name, "settings_unavailable", {
        error: toErrorMessage(providerSettingsResult.reason),
      });
    }
    const providerSettings = providerSettingsResult.value;
    if (!providerSettings.hitmarkerEnabled) {
      return logProviderSkip(this.name, "provider_disabled");
    }
    const query = filters?.query || providerSettings.hitmarkerDefaultQuery;
    const requestUrl = new URL(providerSettings.hitmarkerApiBaseUrl);
    requestUrl.searchParams.set("search", query);
    requestUrl.searchParams.set("limit", String(providerSettings.gamingBoardResultLimit));
    const responseResult = await settle(
      fetch(requestUrl.toString(), {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(providerSettings.providerTimeoutMs),
      }),
    );
    if (responseResult.status === "rejected") {
      return logProviderFailure(this.name, "request_failed", {
        error: toErrorMessage(responseResult.reason),
        requestUrl: requestUrl.toString(),
      });
    }
    const response = responseResult.value;
    if (!response.ok) {
      return logProviderFailure(this.name, "response_not_ok", {
        requestUrl: requestUrl.toString(),
        status: response.status,
      });
    }

    const rawText = await response.text();
    const parsed = safeParseJson(rawText);
    if (parsed === null) {
      return logProviderFailure(this.name, "invalid_json", {
        requestUrl: requestUrl.toString(),
      });
    }
    const payload = parsed as HitmarkerResponse;
    const jobs = resolveHitmarkerJobs(payload);
    const hitmarkerOrigin = new URL(providerSettings.hitmarkerApiBaseUrl).origin;

    return jobs.slice(0, providerSettings.gamingBoardResultLimit).map((job) => {
      const location = job.location || providerSettings.hitmarkerDefaultLocation;

      return {
        id: generateId(),
        title: job.title || "",
        company: resolveCompanyName(job.company, providerSettings.unknownCompanyLabel),
        location,
        remote: REMOTE_LOCATION_PATTERN.test(location),
        description: job.description || "",
        url: job.url || `${hitmarkerOrigin}/jobs/${job.slug || job.id || generateId()}`,
        source: "hitmarker",
        postedDate: job.created_at || new Date().toISOString(),
        contentHash: resolveHitmarkerContentHash(job),
      };
    });
  }
}

/**
 * Provider for RPA-backed gaming job portals.
 */
export class GamingPortalProvider implements JobProvider {
  name: string;
  type = "gaming-board";
  enabled = true;
  private readonly portalId: GamingPortalId;

  constructor(portalId: GamingPortalId) {
    this.portalId = portalId;
    this.name = portalId;
  }

  async fetchJobs(): Promise<RawJob[]> {
    const providerSettingsResult = await settle(loadJobProviderSettings());
    if (providerSettingsResult.status === "rejected") {
      return logProviderFailure(this.name, "settings_unavailable", {
        error: toErrorMessage(providerSettingsResult.reason),
      });
    }
    const providerSettings = providerSettingsResult.value;
    const portalConfig = resolvePortalConfig(providerSettings.gamingPortals, this.portalId);
    if (!portalConfig?.enabled) {
      return logProviderSkip(this.portalId, "portal_disabled", {
        portalId: this.portalId,
      });
    }

    this.name = portalConfig.name;

    const scrapeMethod = PORTAL_SCRAPE_METHOD_BY_ID[this.portalId];
    const scrapeResult = await settle(scrapeMethod(portalConfig.fallbackUrl));
    if (scrapeResult.status === "rejected") {
      return logProviderFailure(this.name, "scrape_failed", {
        error: toErrorMessage(scrapeResult.reason),
        portalId: this.portalId,
      });
    }
    const scraped = scrapeResult.value;
    return scraped.slice(0, providerSettings.gamingBoardResultLimit).map((job) => ({
      id: generateId(),
      title: job.title,
      company: job.company,
      location: job.location,
      remote: Boolean(job.remote),
      description: job.description || "",
      url: job.url || portalConfig.fallbackUrl,
      source: job.source || portalConfig.source,
      postedDate: job.postedDate || new Date().toISOString(),
      contentHash: job.contentHash,
    }));
  }
}

/**
 * Shared Hitmarker provider instance.
 */
export const hitmarkerProvider = new HitmarkerProvider();

/**
 * Shared Hitmarker portal provider instance.
 */
export const hitmarkerPortalProvider = new GamingPortalProvider("hitmarker");

/**
 * Shared GrackleHQ provider instance.
 */
export const grackleProvider = new GamingPortalProvider("grackle");

/**
 * Shared Work With Indies provider instance.
 */
export const workWithIndiesProvider = new GamingPortalProvider("workwithindies");

/**
 * Shared RemoteGameJobs provider instance.
 */
export const remoteGameJobsProvider = new GamingPortalProvider("remotegamejobs");

/**
 * Shared GamesJobsDirect provider instance.
 */
export const gamesJobsDirectProvider = new GamingPortalProvider("gamesjobsdirect");

/**
 * Shared PocketGamer.biz provider instance.
 */
export const pocketGamerProvider = new GamingPortalProvider("pocketgamer");
