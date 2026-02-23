import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { SCRAPER_DIR } from "../config/paths";
import { db, sqlite } from "../db/client";
import { initializeDatabase } from "../db/init";
import { jobs } from "../db/schema/jobs";
import { scraperService } from "./scraper-service";

const TEST_SCRIPT_NAME = "scraper_contract_test.py";
const TEST_SCRIPT_PATH = join(SCRAPER_DIR, TEST_SCRIPT_NAME);

beforeAll(async () => {
  initializeDatabase(sqlite);
  await Bun.write(
    TEST_SCRIPT_PATH,
    `#!/usr/bin/env python3
import json
import sys

payload = json.loads(sys.stdin.read() or "{}")
mode = payload.get("mode", "mixed")

if mode == "malformed":
    sys.stdout.write("not-json\\n")
    sys.exit(0)

rows = [
    {
        "title": "Gameplay Engineer",
        "company": "Studio Alpha",
        "location": "Remote",
        "url": "https://example.com/jobs/1",
        "source": "gamedev-net",
        "contentHash": "gdn-contract-1",
        "description": "Build gameplay systems",
        "postDate": "2026-02-20",
        "remote": True
    },
    {
        "company": "Invalid Missing Title"
    }
]
sys.stdout.write(json.dumps(rows))
sys.exit(0)
`,
  );
});

beforeEach(async () => {
  await db.delete(jobs);
});

afterAll(() => {
  rmSync(TEST_SCRIPT_PATH, { force: true });
});

describe("scraperService", () => {
  test("captures row-level errors while ingesting valid rows", async () => {
    const result = await scraperService.scrapeGameDevNetJobs(TEST_SCRIPT_NAME);

    expect(result.scraped).toBe(1);
    expect(result.upserted).toBe(1);
    expect(result.errors.some((entry) => entry.includes("job_row_1"))).toBe(true);
  });

  test("reports malformed scraper JSON payloads", async () => {
    await Bun.write(
      TEST_SCRIPT_PATH,
      `#!/usr/bin/env python3
import sys
sys.stdout.write("not-json\\n")
sys.exit(0)
`,
    );

    const result = await scraperService.scrapeGameDevNetJobs(TEST_SCRIPT_NAME);
    expect(result.scraped).toBe(0);
    expect(result.upserted).toBe(0);
    expect(result.errors.some((entry) => entry.includes("invalid JSON"))).toBe(true);
  });
});
