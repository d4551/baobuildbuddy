import { describe, expect, it } from "vitest";
import {
  countConfiguredGamingPortals,
  parseGamingPortalsJson,
  serializeGamingPortalsJson,
  setGamingPortalEnabled,
} from "./gaming-portals-form";

const SAMPLE = [
  {
    id: "workwithindies",
    name: "Work With Indies",
    source: "workwithindies",
    fallbackUrl: "https://www.workwithindies.com/jobs",
    enabled: false,
  },
  {
    id: "grackle",
    name: "GrackleHQ",
    source: "grackle",
    fallbackUrl: "https://gracklehq.com/jobs",
    enabled: true,
  },
] as const;

describe("gaming-portals-form", () => {
  it("parses and serializes portal rows round-trip", () => {
    const json = serializeGamingPortalsJson([...SAMPLE]);
    const parsed = parseGamingPortalsJson(json);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]?.id).toBe("workwithindies");
    expect(parsed[1]?.enabled).toBe(true);
    expect(parseGamingPortalsJson(serializeGamingPortalsJson(parsed))).toEqual(parsed);
  });

  it("returns empty list for invalid JSON", () => {
    expect(parseGamingPortalsJson("{not-json")).toEqual([]);
    expect(parseGamingPortalsJson('"string"')).toEqual([]);
  });

  it("toggles enabled without mutating siblings", () => {
    const next = setGamingPortalEnabled([...SAMPLE], "workwithindies", true);
    expect(next[0]?.enabled).toBe(true);
    expect(next[1]?.enabled).toBe(true);
    expect(SAMPLE[0].enabled).toBe(false);
  });

  it("counts configured portals as enabled+fallbackUrl", () => {
    expect(countConfiguredGamingPortals([...SAMPLE])).toBe(1);
    const both = setGamingPortalEnabled([...SAMPLE], "workwithindies", true);
    expect(countConfiguredGamingPortals(both)).toBe(2);
  });
});
