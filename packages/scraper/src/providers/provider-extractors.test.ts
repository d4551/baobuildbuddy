import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { chromium, type Browser, type Page } from "playwright";
import { extractGamesJobsDirectJobs } from "./gamesjobsdirect";
import { extractGrackleJobs } from "./grackle";
import { extractHitmarkerJobs } from "./hitmarker";
import { extractPocketGamerJobs } from "./pocketgamer";
import { extractRemoteGameJobs } from "./remotegamejobs";
import { extractWorkWithIndiesJobs } from "./workwithindies";

let browser: Browser | null = null;
let page: Page | null = null;

const TEST_SOURCE_URL = "https://example.com/jobs";

const requirePage = (): Page => {
  if (!page) {
    throw new Error("Playwright page was not initialized");
  }

  return page;
};

beforeAll(async () => {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  page = await context.newPage();
});

afterAll(async () => {
  if (browser) {
    await browser.close();
  }
});

describe("portal job extractors", () => {
  test("extracts Hitmarker cards", async () => {
    const activePage = requirePage();
    await activePage.setContent(`
      <a href="/jobs/1">
        <div>Gameplay Engineer</div>
        <div>Studio Alpha</div>
        <div>Remote - Worldwide</div>
      </a>
    `);

    const rows = await extractHitmarkerJobs(activePage, TEST_SOURCE_URL);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.title).toBe("Gameplay Engineer");
    expect(rows[0]?.company).toBe("Studio Alpha");
    expect(rows[0]?.remote).toBe(true);
  });
});

describe("portal job extractors: listing feeds", () => {
  test("extracts Grackle listings", async () => {
    const activePage = requirePage();
    await activePage.setContent(`
      <div class="joblisting">
        <a href="/jobs/2">Senior Tools Engineer</a>
        Studio Beta - Vancouver, BC
      </div>
    `);

    const rows = await extractGrackleJobs(activePage, TEST_SOURCE_URL);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.company).toBe("Studio Beta");
    expect(rows[0]?.location).toContain("Vancouver");
  });

  test("extracts Work With Indies cards", async () => {
    const activePage = requirePage();
    await activePage.setContent(`
      <a class="job-card" href="/careers/123">
        Ember Lab is hiring a Gameplay Programmer to work from Remote Learn More
      </a>
    `);

    const rows = await extractWorkWithIndiesJobs(activePage, TEST_SOURCE_URL);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.company).toBe("Ember Lab");
    expect(rows[0]?.title).toBe("Gameplay Programmer");
  });

  test("extracts RemoteGameJobs boxes", async () => {
    const activePage = requirePage();
    await activePage.setContent(`
      <div class="job-box">
        <div><a class="has-text-black" href="/jobs/remote-1">Backend Engineer</a></div>
        <div>Studio Remote</div>
        <div>Full-time</div>
        <div>Remote</div>
      </div>
    `);

    const rows = await extractRemoteGameJobs(activePage, TEST_SOURCE_URL);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.company).toBe("Studio Remote");
    expect(rows[0]?.location).toBe("Remote");
  });
});

describe("portal job extractors: article and portal cards", () => {
  test("extracts GamesJobsDirect links", async () => {
    const activePage = requirePage();
    await activePage.setContent(`
      <article>
        <div><a href="/job/rendering">Rendering Engineer</a></div>
        <div>Studio Gamma - Remote</div>
      </article>
    `);

    const rows = await extractGamesJobsDirectJobs(activePage, TEST_SOURCE_URL);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.company).toBe("Studio Gamma");
  });

  test("extracts PocketGamer articles", async () => {
    const activePage = requirePage();
    await activePage.setContent(`
      <article>
        <h2>Economy Designer</h2>
        <div class="company">Studio Delta</div>
        <p class="description">Design free-to-play systems.</p>
        <a href="/job/economy">View role</a>
      </article>
    `);

    const rows = await extractPocketGamerJobs(activePage, TEST_SOURCE_URL);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.description).toContain("free-to-play");
  });
});
