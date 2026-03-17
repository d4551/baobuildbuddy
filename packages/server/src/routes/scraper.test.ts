import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { API_ERROR_SCRAPE_JOBS_FAILED, API_ERROR_SCRAPE_STUDIOS_FAILED } from "@bao/shared";
import { scraperService } from "../services/scraper-service";
import { requestJson } from "../test-utils";

type ScraperOperationResult = Awaited<ReturnType<typeof scraperService.scrapeStudios>>;

let app: { handle: (request: Request) => Response | Promise<Response> };
let originalScrapeStudios: typeof scraperService.scrapeStudios;
let originalScrapeJobsForPortal: typeof scraperService.scrapeJobsForPortal;

const successfulScraperResult: ScraperOperationResult = {
  scraped: 2,
  upserted: 2,
  errors: [],
};

const successfulScrapeJobsForPortal = (): Promise<ScraperOperationResult> =>
  Promise.resolve(successfulScraperResult);

const failedScrapeStudios = (): Promise<ScraperOperationResult> =>
  Promise.reject(new Error("studio scrape script failed"));

const failedScrapeJobs = (): Promise<ScraperOperationResult> =>
  Promise.reject(new Error("portal scrape script failed"));

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
  originalScrapeJobsForPortal = scraperService.scrapeJobsForPortal.bind(scraperService);
});

const restoreScraperService = (): void => {
  scraperService.scrapeStudios = originalScrapeStudios;
  scraperService.scrapeJobsForPortal = originalScrapeJobsForPortal;
};

beforeEach(() => {
  restoreScraperService();
});

afterAll(() => {
  restoreScraperService();
});

function registerStudioScraperRouteTests(): void {
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
}

function registerJobScraperRouteTests(): void {
  test("POST /api/scraper/jobs/hitmarker returns scrape result contract on success", async () => {
    scraperService.scrapeJobsForPortal = successfulScrapeJobsForPortal;

    const result = await requestJson<ScraperOperationResult>(
      app,
      "POST",
      "/api/scraper/jobs/hitmarker",
    );

    expect(result.status).toBe(200);
    expect(result.body.scraped).toBe(2);
    expect(result.body.upserted).toBe(2);
    expect(result.body.errors).toEqual([]);
  });

  test("POST /api/scraper/jobs/grackle forwards service errors as API error payload", async () => {
    scraperService.scrapeJobsForPortal = failedScrapeJobs;

    const result = await requestJson<{ error: string; details: string }>(
      app,
      "POST",
      "/api/scraper/jobs/grackle",
    );

    expect(result.status).toBe(500);
    expect(result.body.error).toBe(API_ERROR_SCRAPE_JOBS_FAILED);
    expect(result.body.details).toContain("portal scrape script failed");
  });

  test("POST /api/scraper/jobs/:portalId rejects unsupported portals", async () => {
    const result = await requestJson<{ error: string; details: string }>(
      app,
      "POST",
      "/api/scraper/jobs/not-a-portal",
    );

    expect(result.status).toBe(400);
    expect(result.body.error).toBe(API_ERROR_SCRAPE_JOBS_FAILED);
    expect(result.body.details).toContain("Unsupported scraper portal");
  });
}

describe("scraper routes", () => {
  registerStudioScraperRouteTests();
  registerJobScraperRouteTests();
});
