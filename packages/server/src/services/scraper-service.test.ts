import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { rmSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { JobProviderSettings } from "@bao/shared/types/settings-contracts";
import { DEFAULT_AUTOMATION_SETTINGS, DEFAULT_SETTINGS_ID } from "@bao/shared/types/settings-defaults";
import { SCRAPER_DIR } from "../config/paths";
import { db, sqlite } from "../db/client";
import { initializeDatabase } from "../db/init";
import { jobs } from "../db/schema/jobs";
import { settings } from "../db/schema/settings";
import { scraperService } from "./scraper-service";

const TEST_SCRIPT_NAME = "scraper_contract_test.ts";
const TEST_SCRIPT_PATH = join(SCRAPER_DIR, TEST_SCRIPT_NAME);
const buildApiTemplate = (origin: string, path: string, query = ""): string =>
  `${origin}${path}${query}`;
const buildFilterQuery = (field: string, value: string): string => `?filter[${field}]=${value}`;

const TEST_JOB_PROVIDER_SETTINGS: JobProviderSettings = {
  providerTimeoutMs: 5_000,
  companyBoardResultLimit: 25,
  gamingBoardResultLimit: 25,
  unknownLocationLabel: "Unknown location",
  unknownCompanyLabel: "Unknown company",
  hitmarkerEnabled: true,
  hitmarkerApiBaseUrl: "https://api.hitmarker.test/jobs",
  hitmarkerDefaultQuery: "engineer",
  hitmarkerDefaultLocation: "Remote",
  greenhouseApiBaseUrl: "https://boards.greenhouse.io",
  greenhouseMaxPages: 1,
  greenhouseBoards: [],
  leverApiBaseUrl: "https://api.lever.co/v0/postings",
  leverMaxPages: 1,
  leverCompanies: [],
  companyBoardApiTemplates: {
    greenhouse: "https://boards.greenhouse.io/__TOKEN__/jobs",
    lever: "https://api.lever.co/v0/postings/__TOKEN__?mode=json",
    recruitee: "https://api.recruitee.com/c/__TOKEN__/careers/offers",
    workable: "https://apply.workable.com/api/v3/accounts/__TOKEN__/jobs",
    ashby: "https://jobs.ashbyhq.com/api/non-user-graphql?organizationId=__TOKEN__",
    smartrecruiters: "https://api.smartrecruiters.com/v1/companies/__TOKEN__/postings",
    teamtailor: buildApiTemplate(
      "https://api.teamtailor.com",
      "/v1/jobs",
      buildFilterQuery("organization", "__TOKEN__"),
    ),
    workday: "https://__TOKEN__/wday/cxs/__TOKEN__/jobs",
  },
  companyBoards: [],
  gamingPortals: [
    {
      id: "hitmarker",
      name: "Hitmarker",
      source: "hitmarker",
      fallbackUrl: "https://example.com/hitmarker",
      enabled: true,
    },
  ],
};

beforeAll(async () => {
  initializeDatabase(sqlite);
  await writeFile(
    TEST_SCRIPT_PATH,
    `const payload = JSON.parse((await Bun.stdin.text()) || "{}");
const mode = typeof payload.mode === "string" ? payload.mode : "mixed";

if (mode === "malformed") {
  process.stdout.write("not-json\\n");
  process.exit(0);
}

const rows = [
  {
    title: "Gameplay Engineer",
    company: "Studio Alpha",
    location: "Remote",
    url: "https://example.com/jobs/1",
    source: "hitmarker",
    contentHash: "gdn-contract-1",
    description: "Build gameplay systems",
    postDate: "2026-02-20",
    remote: true,
  },
  {
    company: "Invalid Missing Title",
  },
];
process.stdout.write(JSON.stringify(rows));
process.exit(0);
`,
  );
});

beforeEach(async () => {
  await db.delete(jobs);
  await db.delete(settings);
  await db.insert(settings).values({
    id: DEFAULT_SETTINGS_ID,
    automationSettings: {
      ...DEFAULT_AUTOMATION_SETTINGS,
      jobProviders: TEST_JOB_PROVIDER_SETTINGS,
    },
  });
});

afterAll(() => {
  rmSync(TEST_SCRIPT_PATH, { force: true });
});

function registerScraperIngestionTests(): void {
  test("captures row-level errors while ingesting valid rows", async () => {
    const result = await scraperService.scrapeHitmarkerJobs({ scriptPath: TEST_SCRIPT_NAME });

    expect(result.scraped).toBe(1);
    expect(result.upserted).toBe(1);
    expect(result.enrichment.enrichedRecords).toBe(1);
    expect(result.errors.some((entry) => entry.includes("job_row_1"))).toBe(true);

    const persistedRows = await db.select().from(jobs);
    expect(persistedRows[0]?.enrichment).not.toBeNull();
  });

  test("reports malformed scraper JSON payloads", async () => {
    await writeFile(
      TEST_SCRIPT_PATH,
      `process.stdout.write("not-json\\n");
process.exit(0);
`,
    );

    const result = await scraperService.scrapeHitmarkerJobs({ scriptPath: TEST_SCRIPT_NAME });
    expect(result.scraped).toBe(0);
    expect(result.upserted).toBe(0);
    expect(result.enrichment.enrichedRecords).toBe(0);
    expect(result.errors.some((entry) => entry.includes("invalid JSON"))).toBe(true);
  });
}

function registerScraperHashTests(): void {
  test("derives deterministic content hashes when scraper rows omit contentHash", async () => {
    await writeFile(
      TEST_SCRIPT_PATH,
      `process.stdout.write(JSON.stringify([
  {
    title: "AI Gameplay Engineer",
    company: "Studio Hash",
    location: "Remote",
    url: "https://example.com/jobs/hash",
    source: "contract-source",
    description: "Build deterministic systems",
    postDate: "2026-02-23",
    remote: true,
  },
]));
process.exit(0);
`,
    );

    const firstRun = await scraperService.scrapeHitmarkerJobs({ scriptPath: TEST_SCRIPT_NAME });
    expect(firstRun.upserted).toBe(1);
    const firstRows = await db.select().from(jobs);
    const firstHash = firstRows[0]?.contentHash ?? "";
    expect(firstHash.startsWith("job-")).toBe(true);

    await db.delete(jobs);

    const secondRun = await scraperService.scrapeHitmarkerJobs({ scriptPath: TEST_SCRIPT_NAME });
    expect(secondRun.upserted).toBe(1);
    const secondRows = await db.select().from(jobs);
    const secondHash = secondRows[0]?.contentHash ?? "";
    expect(secondHash).toBe(firstHash);
  });
}

function registerScraperRefreshTests(): void {
  test("refreshes stored enrichment when an existing content hash is scraped again", async () => {
    await writeFile(
      TEST_SCRIPT_PATH,
      `process.stdout.write(JSON.stringify([
  {
    title: "AI Gameplay Engineer",
    company: "Studio Refresh",
    location: "Remote",
    url: "https://example.com/jobs/refresh",
    source: "contract-source",
    contentHash: "refresh-hash",
    description: "Initial description",
    postDate: "2026-02-24",
    remote: true,
  },
]));
process.exit(0);
`,
    );

    const firstRun = await scraperService.scrapeHitmarkerJobs({ scriptPath: TEST_SCRIPT_NAME });
    expect(firstRun.upserted).toBe(1);

    await writeFile(
      TEST_SCRIPT_PATH,
      `process.stdout.write(JSON.stringify([
  {
    title: "AI Gameplay Engineer",
    company: "Studio Refresh",
    location: "Remote",
    url: "https://example.com/jobs/refresh",
    source: "contract-source",
    contentHash: "refresh-hash",
    description: "Updated description for the same posting",
    postDate: "2026-02-25",
    remote: true,
  },
]));
process.exit(0);
`,
    );

    const secondRun = await scraperService.scrapeHitmarkerJobs({ scriptPath: TEST_SCRIPT_NAME });
    expect(secondRun.upserted).toBe(1);

    const persistedRows = await db.select().from(jobs);
    expect(persistedRows).toHaveLength(1);
    expect(persistedRows[0]?.description).toBe("Updated description for the same posting");
    expect(persistedRows[0]?.enrichment).not.toBeNull();
  });
}

describe("scraperService", () => {
  registerScraperIngestionTests();
  registerScraperHashTests();
  registerScraperRefreshTests();
});
