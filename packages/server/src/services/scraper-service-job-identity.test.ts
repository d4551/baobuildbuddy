import { describe, expect, test } from "bun:test";
import type { JobSearchResult } from "@bao/shared/types/jobs";
import { resolveJobContentHash } from "./scraper-service-persistence";

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
  test("prefers the hash the provider supplied", () => {
    expect(resolveJobContentHash(buildJob({ contentHash: "hitmarker-b19a28c53fc2" }))).toBe(
      "hitmarker-b19a28c53fc2",
    );
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
