import type { GamingPortalConfig, GamingPortalId } from "@bao/shared";
import { generateId } from "@bao/shared";
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
const settlePromise = async <T>(operation: Promise<T>): Promise<PromiseSettledResult<T>> => {
  const [result] = await Promise.allSettled([operation]);
  return result;
};

type PortalScrapeMethod = (sourceUrl?: string) => Promise<ScrapedJob[]>;

const WHITESPACE_PATTERN = /\s+/g;
const NON_HASH_SAFE_PATTERN = /[^a-z0-9-_]/g;
const REMOTE_LOCATION_PATTERN = /remote/i;

const PORTAL_SCRAPE_METHOD_BY_ID: Record<GamingPortalId, PortalScrapeMethod> = {
  "gamedev-net": () => scraperService.scrapeGameDevNetJobsRaw(),
  grackle: () => scraperService.scrapeGrackleJobsRaw(),
  workwithindies: () => scraperService.scrapeWorkWithIndiesJobsRaw(),
  remotegamejobs: () => scraperService.scrapeRemoteGameJobsRaw(),
  gamesjobsdirect: () => scraperService.scrapeGamesJobsDirectRaw(),
  pocketgamer: () => scraperService.scrapePocketGamerJobsRaw(),
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
    const providerSettingsResult = await settlePromise(loadJobProviderSettings());
    if (providerSettingsResult.status === "rejected") {
      return [];
    }
    const providerSettings = providerSettingsResult.value;
    const query = filters?.query || providerSettings.hitmarkerDefaultQuery;
    const requestUrl = new URL(providerSettings.hitmarkerApiBaseUrl);
    requestUrl.searchParams.set("search", query);
    requestUrl.searchParams.set("limit", String(providerSettings.gamingBoardResultLimit));
    const responseResult = await settlePromise(
      fetch(requestUrl.toString(), {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(providerSettings.providerTimeoutMs),
      }),
    );
    if (responseResult.status === "rejected") {
      return [];
    }
    const response = responseResult.value;
    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as HitmarkerResponse;
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
    const providerSettingsResult = await settlePromise(loadJobProviderSettings());
    if (providerSettingsResult.status === "rejected") {
      return [];
    }
    const providerSettings = providerSettingsResult.value;
    const portalConfig = resolvePortalConfig(providerSettings.gamingPortals, this.portalId);
    if (!portalConfig?.enabled) {
      return [];
    }

    this.name = portalConfig.name;

    const scrapeMethod = PORTAL_SCRAPE_METHOD_BY_ID[this.portalId];
    const scrapeResult = await settlePromise(scrapeMethod(portalConfig.fallbackUrl));
    if (scrapeResult.status === "rejected") {
      return [];
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
 * Shared GameDev.net provider instance.
 */
export const gameDevNetProvider = new GamingPortalProvider("gamedev-net");

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
