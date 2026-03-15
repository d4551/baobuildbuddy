import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { API_ERROR_SCRAPE_JOBS_FAILED, API_ERROR_SCRAPE_STUDIOS_FAILED } from "@bao/shared";
import { scraperService } from "../services/scraper-service";
import { requestJson } from "../test-utils";

type ScraperOperationResult = Awaited<ReturnType<typeof scraperService.scrapeStudios>>;

let app: { handle: (request: Request) => Response | Promise<Response> };
let originalScrapeStudios: typeof scraperService.scrapeStudios;
let originalScrapeHitmarkerJobs: typeof scraperService.scrapeHitmarkerJobs;

const successfulScraperResult: ScraperOperationResult = {
  scraped: 2,
  upserted: 2,
  errors: [],
};

const successfulScrapeHitmarkerJobs = (): Promise<ScraperOperationResult> => Promise.resolve(successfulScraperResult);

const failedScrapeStudios = (): Promise<ScraperOperationResult> => Promise.reject(new Error("studio scrape script failed"));

const failedScrapeJobs = (): Promise<ScraperOperationResult> => Promise.reject(new Error("hitmarker scrape script failed"));

beforeAll(async () => {
  const initModule = await import("../db/init");
  const seedModule = await import("../db/seed");
  const routesModule = await import("./scraper.routes");
  const { Elysia } = await import("elysia");
  const dbModule = await import("../db/client");

  initModule.initializeDatabase(dbModule.sqlite);
  seedModule.seedDatabase(dbModule.db);

  app = new Elysia({ prefix: "/api" }).use(routesModule.scraperRoutes);
  originalScrapeStudios = scraperService.scrapeStudios.bind(scraperService);
  originalScrapeHitmarkerJobs = scraperService.scrapeHitmarkerJobs.bind(scraperService);
});

const restoreScraperService = (): void => {
  scraperService.scrapeStudios = originalScrapeStudios;
  scraperService.scrapeHitmarkerJobs = originalScrapeHitmarkerJobs;
};

beforeEach(() => {
  restoreScraperService();
});

afterAll(() => {
  restoreScraperService();
});

describe("scraper routes", () => {
  test("POST /api/scraper/studios returns scrape result contract on success", async () => {
    scraperService.scrapeStudios = () => Promise.resolve(successfulScraperResult);

    const result = await requestJson<ScraperOperationResult>(app, "POST", "/api/scraper/studios");

    expect(result.status).toBe(200);
    expect(result.body.scraped).toBe(2);
    expect(result.body.upserted).toBe(2);
    expect(Array.isArray(result.body.errors)).toBe(true);
    expect(result.body.errors).toEqual([]);
  });

  test("POST /api/scraper/studios forwards service errors as API error payload", async () => {
    scraperService.scrapeStudios = failedScrapeStudios;

    const result = await requestJson<{ error: string; details: string }>(
      app,
      "POST",
      "/api/scraper/studios",
    );

    expect(result.status).toBe(500);
    expect(result.body.error).toBe(API_ERROR_SCRAPE_STUDIOS_FAILED);
    expect(result.body.details).toContain("studio scrape script failed");
  });

  test("POST /api/scraper/jobs/hitmarker returns scrape result contract on success", async () => {
    scraperService.scrapeHitmarkerJobs = successfulScrapeHitmarkerJobs;

    const result = await requestJson<ScraperOperationResult>(app, "POST", "/api/scraper/jobs/hitmarker");

    expect(result.status).toBe(200);
    expect(result.body.scraped).toBe(2);
    expect(result.body.upserted).toBe(2);
    expect(result.body.errors).toEqual([]);
  });

  test("POST /api/scraper/jobs/hitmarker forwards service errors as API error payload", async () => {
    scraperService.scrapeHitmarkerJobs = failedScrapeJobs;

    const result = await requestJson<{ error: string; details: string }>(
      app,
      "POST",
      "/api/scraper/jobs/hitmarker",
    );

    expect(result.status).toBe(500);
    expect(result.body.error).toBe(API_ERROR_SCRAPE_JOBS_FAILED);
    expect(result.body.details).toContain("hitmarker scrape script failed");
  });
});
