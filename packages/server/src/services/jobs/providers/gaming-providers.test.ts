import { beforeEach, describe, expect, mock, test } from "bun:test";
import { jobProviderSettingsSchema } from "@bao/shared/schemas/settings.schema";
import type { GamingPortalId } from "@bao/shared/types/settings-contracts";
import type { ScrapedJob } from "../../scraper-service";
import type * as GamingProvidersModule from "./gaming-providers";
import type { JobProvider, RawJob } from "./provider-interface";

type LoggerEntry = readonly unknown[];
type ProviderSettings = ReturnType<typeof createJobProviderSettings>;
type ProviderModule = typeof GamingProvidersModule;
type ScrapeImpl = () => Promise<ScrapedJob[]>;

const loggerEntries: {
  error: LoggerEntry[];
  info: LoggerEntry[];
} = {
  error: [],
  info: [],
};

const noopLogger = (): void => undefined;
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;
const isProviderModule = (value: unknown): value is ProviderModule =>
  isRecord(value) && typeof value.GamingPortalProvider === "function";

const logger = {
  debug: noopLogger,
  warn: noopLogger,
  error: (...values: readonly unknown[]) => {
    loggerEntries.error.push(values);
  },
  info: (...values: readonly unknown[]) => {
    loggerEntries.info.push(values);
  },
};

const createJobProviderSettings = (overrides?: {
  gamingPortals?: Array<{
    id: GamingPortalId;
    name: string;
    source: string;
    fallbackUrl: string;
    enabled: boolean;
  }>;
}) =>
  jobProviderSettingsSchema.parse({
    providerTimeoutMs: 1000,
    companyBoardResultLimit: 20,
    gamingBoardResultLimit: 20,
    unknownLocationLabel: "Unknown location",
    unknownCompanyLabel: "Unknown company",
    greenhouseApiBaseUrl: "https://example.com/greenhouse",
    greenhouseMaxPages: 1,
    greenhouseBoards: [],
    leverApiBaseUrl: "https://example.com/lever",
    leverMaxPages: 1,
    leverCompanies: [],
    companyBoardApiTemplates: {
      greenhouse: "greenhouse",
      lever: "lever",
      recruitee: "recruitee",
      workable: "workable",
      ashby: "ashby",
      smartrecruiters: "smartrecruiters",
      teamtailor: "teamtailor",
      workday: "workday",
    },
    companyBoards: [],
    gamingPortals: overrides?.gamingPortals ?? [
      {
        id: "grackle",
        name: "Grackle",
        source: "grackle",
        fallbackUrl: "https://example.com/grackle",
        enabled: true,
      },
    ],
  });

let loadJobProviderSettingsImpl: () => Promise<ProviderSettings> = () =>
  Promise.resolve(createJobProviderSettings());
let scrapeGrackleImpl: ScrapeImpl = () => Promise.resolve([]);
let scrapeHitmarkerImpl: ScrapeImpl = () => Promise.resolve([]);
let scrapeWorkWithIndiesImpl: ScrapeImpl = () => Promise.resolve([]);
let scrapeRemoteGameJobsImpl: ScrapeImpl = () => Promise.resolve([]);
let scrapeGamesJobsDirectImpl: ScrapeImpl = () => Promise.resolve([]);
let scrapePocketGamerImpl: ScrapeImpl = () => Promise.resolve([]);

await mock.module("./provider-settings", () => ({
  loadJobProviderSettings: () => loadJobProviderSettingsImpl(),
}));

await mock.module("../../scraper-service", () => ({
  scraperService: {
    scrapeHitmarkerJobsRaw: () => scrapeHitmarkerImpl(),
    scrapeGrackleJobsRaw: () => scrapeGrackleImpl(),
    scrapeWorkWithIndiesJobsRaw: () => scrapeWorkWithIndiesImpl(),
    scrapeRemoteGameJobsRaw: () => scrapeRemoteGameJobsImpl(),
    scrapeGamesJobsDirectRaw: () => scrapeGamesJobsDirectImpl(),
    scrapePocketGamerJobsRaw: () => scrapePocketGamerImpl(),
  },
}));

await mock.module("../../../utils/logger", () => ({
  createServerLogger: () => logger,
}));

const loadProviders = (): Promise<ProviderModule> =>
  import(`./gaming-providers.ts?test=${crypto.randomUUID()}`).then((moduleValue: unknown) => {
    if (!isProviderModule(moduleValue)) {
      throw new Error("Failed to load gaming provider module");
    }
    return moduleValue;
  });

const fetchPortalJobs = async (portalId: GamingPortalId): Promise<RawJob[]> => {
  const { GamingPortalProvider } = await loadProviders();
  const provider: JobProvider = new GamingPortalProvider(portalId);
  return provider.fetchJobs();
};

beforeEach(() => {
  loggerEntries.error.length = 0;
  loggerEntries.info.length = 0;
  loadJobProviderSettingsImpl = () => Promise.resolve(createJobProviderSettings());
  scrapeGrackleImpl = () => Promise.resolve([]);
  scrapeHitmarkerImpl = () => Promise.resolve([]);
  scrapeWorkWithIndiesImpl = () => Promise.resolve([]);
  scrapeRemoteGameJobsImpl = () => Promise.resolve([]);
  scrapeGamesJobsDirectImpl = () => Promise.resolve([]);
  scrapePocketGamerImpl = () => Promise.resolve([]);
});

describe("portal-backed gaming providers", () => {
  test("logs disabled gaming portals as skipped", async () => {
    loadJobProviderSettingsImpl = () =>
      Promise.resolve(
        createJobProviderSettings({
          gamingPortals: [
            {
              id: "grackle",
              name: "Grackle",
              source: "grackle",
              fallbackUrl: "https://example.com/grackle",
              enabled: false,
            },
          ],
        }),
      );

    const jobs = await fetchPortalJobs("grackle");

    expect(jobs).toEqual([]);
    expect(
      loggerEntries.info.some((entry) => JSON.stringify(entry).includes("portal_disabled")),
    ).toBe(true);
  });

  test("logs scrape failures for portal-backed providers", async () => {
    scrapeGrackleImpl = () => Promise.reject(new Error("scrape failed"));

    const jobs = await fetchPortalJobs("grackle");

    expect(jobs).toEqual([]);
    expect(
      loggerEntries.error.some((entry) => JSON.stringify(entry).includes("scrape_failed")),
    ).toBe(true);
  });

  test("logs settings failures for portal-backed providers", async () => {
    loadJobProviderSettingsImpl = () => Promise.reject(new Error("settings failed"));

    const jobs = await fetchPortalJobs("grackle");

    expect(jobs).toEqual([]);
    expect(
      loggerEntries.error.some((entry) => JSON.stringify(entry).includes("settings_unavailable")),
    ).toBe(true);
  });
});
