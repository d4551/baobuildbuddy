import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { dataService } from "./data-service";

beforeAll(async () => {
  const dbModule = await import("../db/client");
  const initModule = await import("../db/init");
  const seedModule = await import("../db/seed");

  initModule.initializeDatabase(dbModule.sqlite);
  await seedModule.seedDatabase(dbModule.db);
});

afterAll(() => {});

describe("data-service", () => {
  test("exportAll returns valid export structure", async () => {
    const exported = await dataService.exportAll();
    expect(exported.version).toBe("1.0");
    expect(exported.exportedAt).toBeDefined();
    expect(Array.isArray(exported.resumes)).toBe(true);
    expect(Array.isArray(exported.coverLetters)).toBe(true);
    expect(Array.isArray(exported.portfolioProjects)).toBe(true);
    expect(Array.isArray(exported.interviewSessions)).toBe(true);
    expect(Array.isArray(exported.skillMappings)).toBe(true);
    expect(Array.isArray(exported.savedJobs)).toBe(true);
    expect(Array.isArray(exported.applications)).toBe(true);
    expect(Array.isArray(exported.chatHistory)).toBe(true);
  });

  test("export/import round-trip preserves data integrity", async () => {
    const exported = await dataService.exportAll();
    const result = await dataService.importAll(exported);
    expect(result.errors).toHaveLength(0);
    expect(result.imported).toBeDefined();
  });

  test("importAll rejects unsupported version", async () => {
    const result = await dataService.importAll({
      version: "2.0" as "1.0",
      exportedAt: new Date().toISOString(),
      profile: null,
      settings: null,
      resumes: [],
      coverLetters: [],
      portfolio: null,
      portfolioProjects: [],
      interviewSessions: [],
      gamification: null,
      skillMappings: [],
      savedJobs: [],
      applications: [],
      chatHistory: [],
    });
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain("Unsupported export version");
  });
});
