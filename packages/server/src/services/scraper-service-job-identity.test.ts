import { beforeAll, describe, expect, test } from "bun:test";
import { DEFAULT_JOB_TAXONOMY_SETTINGS } from "@bao/shared/constants/jobs-taxonomy";
import type { JobSearchResult } from "@bao/shared/types/jobs";
import { sqlite } from "../db/client";
import { initializeDatabase } from "../db/init";
import { resolveContentHash } from "./jobs/deduplication";
import { rawJobToInsert } from "./jobs/job-aggregator-mappers";
import { updateJobTaxonomy } from "./jobs/job-taxonomy-service";
import type { RawJob } from "./jobs/providers/provider-interface";
import { resolveJobContentHash } from "./scraper-service-persistence";

beforeAll(async () => {
  // `rawJobToInsert` derives taxonomy from the database, so the aggregator-path
  // assertions below need a schema and a deterministic taxonomy cache.
  initializeDatabase(sqlite);
  await updateJobTaxonomy(DEFAULT_JOB_TAXONOMY_SETTINGS);
});

/**
 * Regression cover for a duplicate-insert bug found by running the real scraper twice:
 * `jobs_content_hash_idx` is the upsert target, but the identity fallback was
 * `job.id` — regenerated every run. A provider that omitted `contentHash` therefore
 * produced a fresh identity per run, `onConflictDoUpdate` never matched, and the jobs
 * table gained a full duplicate set while the run still reported `upserted: N`.
 */

type ScrapedJob = JobSearchResult["jobs"][number];

const buildJob = (overrides: Partial<ScrapedJob>): ScrapedJob => ({
  id: "run-scoped-random-id",
  title: "Lead Artist (Digital Gaming)",
  company: "Mattel",
  location: "El Segundo, CA",
  remote: false,
  description: "Own the visual direction for digital gaming titles.",
  url: "https://example.test/jobs/lead-artist",
  source: "hitmarker",
  postedDate: "2026-07-20",
  type: "full-time",
  ...overrides,
});

describe("resolveJobContentHash", () => {
  /**
   * This previously asserted the opposite — that a provider's hash won. That preference was
   * the duplicate-row bug: only the scraper's postings carry the field, so the aggregator and
   * the persistence path resolved one posting two ways. Identity is derived, never adopted.
   */
  test("never returns a provider-supplied hash verbatim", () => {
    const providerHash = "hitmarker-b19a28c53fc2";

    expect(resolveJobContentHash(buildJob({ contentHash: providerHash }))).not.toBe(providerHash);
  });

  test("is stable across runs when the provider omits a hash", () => {
    // Same posting, different per-run row id: identity must not move.
    const first = resolveJobContentHash(buildJob({ id: "id-from-run-one" }));
    const second = resolveJobContentHash(buildJob({ id: "id-from-run-two" }));
    expect(second).toBe(first);
  });

  test("never derives identity from the per-run row id", () => {
    const hash = resolveJobContentHash(buildJob({ id: "0123456789abcdef0123456789abcdef" }));
    expect(hash.startsWith("0123456789abcdef")).toBe(false);
  });

  test("distinguishes different postings", () => {
    const artist = resolveJobContentHash(buildJob({}));
    const engineer = resolveJobContentHash(
      buildJob({ title: "Gameplay Engineer", url: "https://example.test/jobs/gameplay-engineer" }),
    );
    expect(engineer).not.toBe(artist);
  });

  test("distinguishes the same title at different companies", () => {
    const mattel = resolveJobContentHash(buildJob({ url: "" }));
    const riot = resolveJobContentHash(buildJob({ url: "", company: "Riot Games" }));
    expect(riot).not.toBe(mattel);
  });

  test("ignores case and surrounding whitespace so trivial markup changes do not duplicate", () => {
    const plain = resolveJobContentHash(buildJob({}));
    const noisy = resolveJobContentHash(
      buildJob({ title: "  Lead Artist (Digital Gaming)  ", company: "MATTEL" }),
    );
    expect(noisy).toBe(plain);
  });
});

/**
 * The aggregator and the scraper persistence layer both write `jobs` keyed on
 * `content_hash`. They previously derived identity independently — the aggregator always
 * hashed title|company|location while persistence preferred the provider's hash — so one
 * Hitmarker posting ingested by both paths was stored twice, once as `87559af9…` and once
 * as `hitmarker-b19a28…`. Nothing asserted the two agreed, which is why the suite stayed
 * green while the jobs table carried six duplicate pairs.
 */
describe("cross-path job identity", () => {
  const posting = {
    title: "Lead Artist (Digital Gaming)",
    company: "Mattel",
    location: "El Segundo, CA",
  };

  const PROVIDER_HASH = "hitmarker-b19a28c53fc2";

  test("both paths resolve a provider-hashed posting to the same identity", () => {
    expect(resolveContentHash(posting)).toBe(
      resolveJobContentHash(buildJob({ contentHash: PROVIDER_HASH })),
    );
  });

  test("both paths resolve a hashless posting to the same identity", () => {
    expect(resolveContentHash(posting)).toBe(resolveJobContentHash(buildJob({})));
  });

  /**
   * Cross-path agreement alone was not enough. Identity previously preferred a
   * provider-supplied hash when one rode along, and only the scraper's postings carry that
   * field — so one posting still resolved two ways depending on which path ingested it.
   * Verified in the live database: "Customer Support Lead" at Swish Breaks was stored twice
   * under one source, as `3c67abbb…` and as `hitmarker-45380d86f091`.
   */
  test("a supplied provider hash does not change a posting's identity", () => {
    expect(resolveJobContentHash(buildJob({ contentHash: PROVIDER_HASH }))).toBe(
      resolveJobContentHash(buildJob({})),
    );
  });

  test("a posting is never stored under two identities across paths", () => {
    const identities = new Set([
      resolveContentHash(posting),
      resolveJobContentHash(buildJob({})),
      resolveJobContentHash(buildJob({ contentHash: PROVIDER_HASH })),
    ]);

    expect(identities.size).toBe(1);
  });

  const buildRawJob = (overrides: Partial<RawJob> = {}): RawJob => ({
    ...posting,
    description: "Own the visual direction for digital gaming titles.",
    url: "https://example.test/jobs/lead-artist",
    source: "hitmarker",
    postedDate: "2026-07-20",
    ...overrides,
  });

  test("the aggregator writes the same identity the scraper path writes", async () => {
    const contentHash = "hitmarker-b19a28c53fc2";
    const inserted = await rawJobToInsert(buildRawJob({ contentHash }));

    expect(inserted.contentHash).toBe(resolveJobContentHash(buildJob({ contentHash })));
  });

  test("the aggregator matches the scraper path when the provider omits a hash", async () => {
    const inserted = await rawJobToInsert(buildRawJob());

    expect(inserted.contentHash).toBe(resolveJobContentHash(buildJob({})));
  });
});
