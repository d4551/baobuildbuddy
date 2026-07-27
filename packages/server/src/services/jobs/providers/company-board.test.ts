import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import { jobProviderSettingsSchema } from "@bao/shared/schemas/settings.schema";
import { isRecord } from "@bao/shared/utils/type-guards";
import type * as CompanyBoardModule from "./company-board";
import type { RawJob } from "./provider-interface";

type LoggerEntry = readonly unknown[];
type ProviderModule = typeof CompanyBoardModule;
type FetchImpl = (
  input: URL | RequestInfo,
  init?: RequestInit | BunFetchRequestInit,
) => Promise<Response>;

const loggerEntries: {
  error: LoggerEntry[];
  info: LoggerEntry[];
} = {
  error: [],
  info: [],
};

const noopLogger = (): void => undefined;
const isProviderModule = (value: unknown): value is ProviderModule =>
  isRecord(value) && typeof value.CompanyBoardProvider === "function";

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

const createJobProviderSettings = () =>
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
      greenhouse: "https://example.com/boards/{token}/jobs",
      lever: "https://example.com/lever/{token}",
      recruitee: "https://example.com/recruitee/{token}",
      workable: "https://example.com/workable/{token}",
      ashby: "https://example.com/ashby/{token}",
      smartrecruiters: "https://example.com/smartrecruiters/{token}",
      teamtailor: "https://example.com/teamtailor/{token}",
      workday: "https://example.com/workday/{token}",
    },
    companyBoards: [],
    gamingPortals: [],
  });

type ProviderSettings = ReturnType<typeof createJobProviderSettings>;

let loadJobProviderSettingsImpl: () => Promise<ProviderSettings> = () =>
  Promise.resolve(createJobProviderSettings());
let fetchImpl: FetchImpl = () => Promise.resolve(new Response("[]", { status: 200 }));

// Destructured before the mocks are installed so the real bindings are copied
// rather than read back through the (by then replaced) namespaces.
const { loadJobProviderSettings: realLoadJobProviderSettings } = await import(
  "./provider-settings"
);
const { createServerLogger: realCreateServerLogger } = await import("../../../utils/logger");

await mock.module("./provider-settings", () => ({
  loadJobProviderSettings: () => loadJobProviderSettingsImpl(),
}));

await mock.module("../../../utils/logger", () => ({
  createServerLogger: () => logger,
}));

const originalFetch = globalThis.fetch;

function mockedFetch(input: URL | RequestInfo, init?: RequestInit | BunFetchRequestInit) {
  return fetchImpl(input, init);
}

mockedFetch.preconnect = globalThis.fetch.preconnect;
globalThis.fetch = mockedFetch;

const loadProviders = (): Promise<ProviderModule> =>
  import(`./company-board.ts?test=${crypto.randomUUID()}`).then((moduleValue: unknown) => {
    if (!isProviderModule(moduleValue)) {
      throw new Error("Failed to load company board module");
    }
    return moduleValue;
  });

const fetchBoardJobs = async (): Promise<RawJob[]> => {
  const { CompanyBoardProvider } = await loadProviders();
  const provider = new CompanyBoardProvider({
    name: "Acme",
    token: "acme",
    type: "greenhouse",
    enabled: true,
    priority: 1,
  });
  return provider.fetchJobs();
};

beforeEach(() => {
  loggerEntries.error.length = 0;
  loggerEntries.info.length = 0;
  loadJobProviderSettingsImpl = () => Promise.resolve(createJobProviderSettings());
  fetchImpl = () => Promise.resolve(new Response("[]", { status: 200 }));
});

// `mock.module` swaps the module for the whole test process and `mock.restore()`
// does not undo it, so the replacements have to be handed back explicitly or every
// later file inherits this file's provider settings and silenced logger.
afterAll(async () => {
  globalThis.fetch = originalFetch;
  mock.restore();
  await mock.module("./provider-settings", () => ({
    loadJobProviderSettings: realLoadJobProviderSettings,
  }));
  await mock.module("../../../utils/logger", () => ({
    createServerLogger: realCreateServerLogger,
  }));
});

describe("company board provider failure logging", () => {
  test("logs a reason-coded failure on non-OK responses and still returns []", async () => {
    fetchImpl = () => Promise.resolve(new Response("upstream error", { status: 500 }));

    const jobs = await fetchBoardJobs();

    expect(jobs).toEqual([]);
    expect(
      loggerEntries.error.some((entry) => JSON.stringify(entry).includes("response_not_ok")),
    ).toBe(true);
  });

  test("logs a reason-coded failure on request rejection and still returns []", async () => {
    fetchImpl = () => Promise.reject(new Error("socket hangup"));

    const jobs = await fetchBoardJobs();

    expect(jobs).toEqual([]);
    expect(
      loggerEntries.error.some((entry) => JSON.stringify(entry).includes("request_failed")),
    ).toBe(true);
  });

  test("logs a reason-coded failure on invalid JSON and still returns []", async () => {
    fetchImpl = () => Promise.resolve(new Response("not-json", { status: 200 }));

    const jobs = await fetchBoardJobs();

    expect(jobs).toEqual([]);
    expect(
      loggerEntries.error.some((entry) => JSON.stringify(entry).includes("invalid_json")),
    ).toBe(true);
  });

  test("logs a reason-coded failure on schema mismatch and still returns []", async () => {
    fetchImpl = () => Promise.resolve(new Response(JSON.stringify(42), { status: 200 }));

    const jobs = await fetchBoardJobs();

    expect(jobs).toEqual([]);
    expect(
      loggerEntries.error.some((entry) => JSON.stringify(entry).includes("invalid_payload")),
    ).toBe(true);
  });

  test("treats empty successful responses as empty results without failure logging", async () => {
    fetchImpl = () => Promise.resolve(new Response("[]", { status: 200 }));

    const jobs = await fetchBoardJobs();

    expect(jobs).toEqual([]);
    expect(loggerEntries.error).toEqual([]);
  });
});
