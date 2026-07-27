import type { GamingPortalConfig, GamingPortalId } from "@bao/shared/types/settings-contracts";
import { toErrorMessage } from "@bao/shared/utils/error-helpers";
import type { JsonValue } from "@bao/shared/utils/json";
import { settle } from "@bao/shared/utils/promise";
import { generateId } from "@bao/shared/utils/validation";
import { createServerLogger } from "../../../utils/logger";
import { type ScrapedJob, scraperService } from "../../scraper-service";
import type { JobProvider, RawJob } from "./provider-interface";
import { loadJobProviderSettings } from "./provider-settings";

type PortalScrapeMethod = (sourceUrl?: string) => Promise<ScrapedJob[]>;

const PORTAL_SCRAPE_METHOD_BY_ID: Record<GamingPortalId, PortalScrapeMethod> = {
  hitmarker: () => scraperService.scrapeHitmarkerJobsRaw(),
  grackle: () => scraperService.scrapeGrackleJobsRaw(),
  workwithindies: () => scraperService.scrapeWorkWithIndiesJobsRaw(),
  remotegamejobs: () => scraperService.scrapeRemoteGameJobsRaw(),
  gamesjobsdirect: () => scraperService.scrapeGamesJobsDirectRaw(),
  pocketgamer: () => scraperService.scrapePocketGamerJobsRaw(),
};
const gamingProviderLogger = createServerLogger("gaming-providers");

const logProviderFailure = (
  providerName: string,
  reason: string,
  details?: JsonValue,
): RawJob[] => {
  gamingProviderLogger.error("Job provider fetch failed", {
    providerName,
    reason,
    details,
  });
  return [];
};

const logProviderSkip = (providerName: string, reason: string, details?: JsonValue): RawJob[] => {
  gamingProviderLogger.info("Job provider fetch skipped", {
    providerName,
    reason,
    details,
  });
  return [];
};

const resolvePortalConfig = (
  portals: GamingPortalConfig[],
  portalId: GamingPortalId,
): GamingPortalConfig | null => portals.find((portal) => portal.id === portalId) ?? null;

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
