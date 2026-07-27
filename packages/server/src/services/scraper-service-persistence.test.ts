import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { DEFAULT_JOB_TAXONOMY_SETTINGS } from "@bao/shared/constants/jobs-taxonomy";
import type { Job, JobSearchResult } from "@bao/shared/types/jobs";
import { eq } from "drizzle-orm";
import { db, sqlite } from "../db/client";
import { initializeDatabase } from "../db/init";
import { jobs } from "../db/schema/jobs";
import { updateJobTaxonomy } from "./jobs/job-taxonomy-service";
import { resolveContentHash } from "./jobs/deduplication";
import { upsertScrapedJob } from "./scraper-service-persistence";

const buildScrapedJob = (overrides: Partial<Job> = {}): JobSearchResult["jobs"][number] => ({
  id: overrides.id ?? "scrape-1",
  title: overrides.title ?? "Gameplay Engineer",
  company: overrides.company ?? "Test Studio",
  location: overrides.location ?? "Remote",
  remote: overrides.remote ?? true,
  type: overrides.type ?? "full-time",
  postedDate: overrides.postedDate ?? new Date().toISOString(),
  description: overrides.description,
  requirements: overrides.requirements,
  technologies: overrides.technologies,
  url: overrides.url,
  source: overrides.source,
  contentHash: overrides.contentHash,
});

/**
 * Rows are addressed by the identity ingest actually assigns, which derives from
 * title/company/location alone. These cases previously passed a distinct `contentHash`
 * literal per test and looked the row up by it — that only isolated them because identity
 * preferred a provider-supplied hash, the same escape hatch that let one posting be stored
 * twice. Each case now varies the posting itself.
 */
const fetchJobRow = async (job: JobSearchResult["jobs"][number]) => {
  const rows = await db
    .select()
    .from(jobs)
    .where(eq(jobs.contentHash, resolveContentHash(job)));
  return rows[0];
};

beforeAll(async () => {
  initializeDatabase(sqlite);
  // Reset the shared taxonomy cache to canonical defaults so extraction is
  // deterministic regardless of test ordering (other suites mutate this cache).
  await updateJobTaxonomy(DEFAULT_JOB_TAXONOMY_SETTINGS);
});

afterAll(async () => {
  await db.delete(jobs);
});

describe("upsertScrapedJob ingestion", () => {
  test("extracts requirements and technologies from the description when the provider omits them", async () => {
    const job = buildScrapedJob({
        title: "Gameplay Engineer",
        description:
          "We need a Gameplay Engineer with strong C++ and Unreal Engine experience. Git and Perforce for version control.",
      });
    await upsertScrapedJob(job, new Date().toISOString());

    const row = await fetchJobRow(job);
    expect(row).toBeDefined();
    expect(row?.requirements ?? []).toContain("C++");
    expect(row?.requirements ?? []).toContain("Unreal Engine");
    expect(row?.technologies ?? []).toContain("Unreal Engine");
    expect(row?.technologies ?? []).toContain("Git");
    expect(row?.technologies ?? []).toContain("Perforce");
  });

  test("prefers provider-supplied requirements and technologies over extraction", async () => {
    const job = buildScrapedJob({
        title: "Combat Systems Engineer",
        description: "Build gameplay systems in Unreal Engine and C++.",
        requirements: ["Custom Requirement"],
        technologies: ["Custom Tech"],
      });
    await upsertScrapedJob(job, new Date().toISOString());

    const row = await fetchJobRow(job);
    expect(row).toBeDefined();
    expect(row?.requirements).toEqual(["Custom Requirement"]);
    expect(row?.technologies).toEqual(["Custom Tech"]);
  });

  test("persists empty arrays when description has no taxonomy matches", async () => {
    const job = buildScrapedJob({
        title: "Live Ops Producer",
        description: "A role with no recognizable keywords whatsoever.",
      });
    await upsertScrapedJob(job, new Date().toISOString());

    const row = await fetchJobRow(job);
    expect(row).toBeDefined();
    expect(row?.requirements).toEqual([]);
    expect(row?.technologies).toEqual([]);
  });
});
