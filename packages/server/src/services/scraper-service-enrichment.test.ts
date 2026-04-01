import { describe, expect, test } from "bun:test";
import {
  buildFallbackJobEnrichment,
  buildFallbackStudioEnrichment,
  parseScrapeEnrichmentContent,
} from "./scraper-service-enrichment";

const registerFencedJsonTest = (): void => {
  test("parses fenced JSON responses", () => {
    const enrichment = parseScrapeEnrichmentContent(`\`\`\`json
{
  "summary": "Grounded summary.",
  "hiringSignals": ["signal 1", "signal 2"],
  "interviewFocusAreas": ["focus 1"],
  "candidatePitchAngles": ["pitch 1"]
}
\`\`\``);

    expect(enrichment).toEqual({
      summary: "Grounded summary.",
      hiringSignals: ["signal 1", "signal 2"],
      interviewFocusAreas: ["focus 1"],
      candidatePitchAngles: ["pitch 1"],
    });
  });
};

const registerEmbeddedJsonTest = (): void => {
  test("parses embedded JSON surrounded by commentary", () => {
    const enrichment = parseScrapeEnrichmentContent(
      `Here is the enrichment payload:
{
  "summary": "Useful summary.",
  "hiringSignals": ["signal 1"],
  "interviewFocusAreas": ["focus 1", "focus 2"],
  "candidatePitchAngles": ["pitch 1", "pitch 2"]
}
Use it directly.`,
    );

    expect(enrichment).toEqual({
      summary: "Useful summary.",
      hiringSignals: ["signal 1"],
      interviewFocusAreas: ["focus 1", "focus 2"],
      candidatePitchAngles: ["pitch 1", "pitch 2"],
    });
  });
};

const registerFallbackJobTest = (): void => {
  test("builds grounded job fallback enrichment when JSON parsing fails", () => {
    const enrichment = buildFallbackJobEnrichment({
      title: "AI Gameplay Engineer",
      company: "Studio Hash",
      location: "Remote",
      remote: true,
      source: "hitmarker",
      description: "Build AI gameplay systems for a live action game",
      postDate: "2026-04-01",
    });

    expect(enrichment.summary).toContain("Build AI gameplay systems");
    expect(enrichment.hiringSignals).toContain("AI Gameplay Engineer is the stated role.");
    expect(enrichment.candidatePitchAngles).toContain(
      "Show why Studio Hash is a strong match.",
    );
  });
};

const registerFallbackStudioTest = (): void => {
  test("builds grounded studio fallback enrichment when JSON parsing fails", () => {
    const enrichment = buildFallbackStudioEnrichment({
      name: "Studio Hash",
      location: "Seoul",
      size: "Small",
      type: "Indie",
      description: "Builds experimental multiplayer games",
      games: ["Project Echo"],
      technologies: ["Bun", "TypeScript"],
      interviewStyle: "Technical systems interview",
      remoteWork: true,
      website: "https://studiohash.example.test",
    });

    expect(enrichment.summary).toContain("Builds experimental multiplayer games");
    expect(enrichment.hiringSignals).toContain("Studio location is Seoul.");
    expect(enrichment.interviewFocusAreas).toContain(
      "Experience with technologies such as Bun, TypeScript.",
    );
  });
};

describe("parseScrapeEnrichmentContent", () => {
  registerFencedJsonTest();
  registerEmbeddedJsonTest();
  registerFallbackJobTest();
  registerFallbackStudioTest();
});
