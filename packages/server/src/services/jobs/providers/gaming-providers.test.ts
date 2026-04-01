import { beforeEach, describe, expect, mock, test } from "bun:test";
import { jobProviderSettingsSchema } from "@bao/shared/schemas/settings.schema";
import type { GamingPortalId } from "@bao/shared/types/settings-contracts";
import type { ScrapedJob } from "../../scraper-service";
import type * as GamingProvidersModule from "./gaming-providers";
import type { JobProvider, RawJob } from "./provider-interface";

type LoggerEntry = readonly unknown[];
type ProviderSettings = ReturnType<typeof createJobProviderSettings>;
type ProviderModule = typeof GamingProvidersModule;
type FetchImpl = (
  input: URL | RequestInfo,
  init?: RequestInit | BunFetchRequestInit,
) => Promise<Response>;
type ScrapeImpl = () => Promise<ScrapedJob[]>;

const loggerEntries: {
  error: LoggerEntry[];
  info: LoggerEntry[];
} = {
  error: [],
  info: [],
};

const noopLogger = (): void => {};
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;
const isProviderModule = (value: unknown): value is ProviderModule =>
  isRecord(value) &&
  typeof value.HitmarkerProvider === "function" &&
  typeof value.GamingPortalProvider === "function";

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
    hitmarkerEnabled: true,
    hitmarkerApiBaseUrl: "https://example.com/hitmarker",
    hitmarkerDefaultQuery: "designer",
    hitmarkerDefaultLocation: "Remote",
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
let fetchImpl: FetchImpl = () => Promise.resolve(new Response("[]", { status: 200 }));

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

function mockedFetch(input: URL | RequestInfo, init?: RequestInit | BunFetchRequestInit) {
  return fetchImpl(input, init);
}

mockedFetch.preconnect = globalThis.fetch.preconnect;
globalThis.fetch = mockedFetch;

const loadProviders = (): Promise<ProviderModule> =>
  import(`./gaming-providers.ts?test=${crypto.randomUUID()}`).then((moduleValue: unknown) => {
    if (!isProviderModule(moduleValue)) {
      throw new Error("Failed to load gaming provider module");
    }
    return moduleValue;
  });

const fetchHitmarkerJobs = async (): Promise<RawJob[]> => {
  const { HitmarkerProvider } = await loadProviders();
  const provider: JobProvider = new HitmarkerProvider();
  return provider.fetchJobs();
};

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
  fetchImpl = () => Promise.resolve(new Response("[]", { status: 200 }));
});

describe("Hitmarker gaming provider", () => {
  test("logs settings failures for Hitmarker requests", async () => {
    loadJobProviderSettingsImpl = () => Promise.reject(new Error("settings failed"));

    const jobs = await fetchHitmarkerJobs();

    expect(jobs).toEqual([]);
    expect(
      loggerEntries.error.some((entry) => JSON.stringify(entry).includes("settings_unavailable")),
    ).toBe(true);
  });

  test("logs invalid JSON responses for Hitmarker requests", async () => {
    fetchImpl = () => Promise.resolve(new Response("not-json", { status: 200 }));

    const jobs = await fetchHitmarkerJobs();

    expect(jobs).toEqual([]);
    expect(
      loggerEntries.error.some((entry) => JSON.stringify(entry).includes("invalid_json")),
    ).toBe(true);
  });

  test("treats empty successful responses as empty results without failure logging", async () => {
    fetchImpl = () => Promise.resolve(new Response("[]", { status: 200 }));

    const jobs = await fetchHitmarkerJobs();

    expect(jobs).toEqual([]);
    expect(loggerEntries.error).toEqual([]);
  });
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
});
