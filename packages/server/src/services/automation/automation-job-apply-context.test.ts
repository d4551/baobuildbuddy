import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { DEFAULT_PROFILE_ID } from "@bao/shared/types/settings-defaults";
import { generateId } from "@bao/shared/utils/validation";
import { db, sqlite } from "../../db/client";
import { initializeDatabase } from "../../db/init";
import { jobs } from "../../db/schema/jobs";
import { portfolioProjects, portfolios } from "../../db/schema/portfolios";
import { studios } from "../../db/schema/studios";
import { userProfile } from "../../db/schema/user";
import { loadJobApplyCandidateContext } from "./automation-job-apply-context";

const cleanTables = async () => {
  await db.delete(portfolioProjects);
  await db.delete(portfolios);
  await db.delete(userProfile);
  await db.delete(jobs);
  await db.delete(studios);
};

beforeAll(async () => {
  initializeDatabase(sqlite);
  await cleanTables();
});

afterAll(async () => {
  await cleanTables();
});

const seedJob = async (): Promise<string> => {
  const jobId = generateId();
  await db.insert(jobs).values({
    id: jobId,
    title: "Senior Gameplay Engineer",
    company: "Test Studio",
    location: "Remote",
    description: "Build gameplay systems.",
    requirements: ["C++", "Unreal Engine"],
    technologies: ["Unreal Engine", "Git"],
    enrichment: {
      summary: "Award-winning indie studio",
      hiringSignals: ["shipped title"],
      interviewFocusAreas: ["system design"],
      candidatePitchAngles: ["passion for gameplay"],
    },
    postedDate: new Date().toISOString(),
  });
  // Studio row whose name matches the job's company so the entity loader resolves it.
  await db.insert(studios).values({
    id: generateId(),
    name: "Test Studio",
    description: "Test Studio makes award-winning indie games.",
    technologies: ["Unreal Engine"],
    games: ["Test Game"],
  });
  return jobId;
};

const seedProfile = async (): Promise<void> => {
  await db.insert(userProfile).values({
    id: DEFAULT_PROFILE_ID,
    name: "Jane Candidate",
    email: "jane@example.test",
    phone: "555-0100",
    location: "Remote",
    website: "https://jane.example",
    linkedin: "https://linkedin.com/in/jane",
    github: "https://github.com/jane",
  });
};

const seedPortfolio = async (): Promise<void> => {
  const portfolioId = generateId();
  await db.insert(portfolios).values({
    id: portfolioId,
    metadata: { title: "Jane's Portfolio", url: "https://jane.example/portfolio" },
  });
  await db.insert(portfolioProjects).values({
    id: generateId(),
    portfolioId,
    title: "Indie Roguelike",
    description: "A shipped roguelike built in Godot.",
    liveUrl: "https://jane.example/roguelike",
    githubUrl: "https://github.com/jane/roguelike",
    featured: true,
  });
};

describe("loadJobApplyCandidateContext", () => {
  test("pulls job, studio, profile, and portfolio context when jobId is provided", async () => {
    await seedProfile();
    await seedPortfolio();
    const jobId = await seedJob();

    const context = await loadJobApplyCandidateContext(jobId);

    expect(context.jobContext).toBeDefined();
    expect(context.jobContext).toContain("Senior Gameplay Engineer");
    expect(context.jobContext).toContain("C++");
    expect(context.jobContext).toContain("Award-winning indie studio");
    expect(context.studioContext).toBeDefined();
    expect(context.studioContext).toContain("Test Studio");
    expect(context.studioContext).toContain("Unreal Engine");
    expect(context.studioContext).toContain("Test Game");
    expect(context.profileContext).toBeDefined();
    expect(context.profileContext).toContain("jane@example.test");
    expect(context.profileContext).toContain("linkedin");
    expect(context.portfolioContext).toBeDefined();
    expect(context.portfolioContext).toContain("https://jane.example/portfolio");
    expect(context.portfolioContext).toContain("Indie Roguelike");
  });

  test("omits job/studio context but still loads profile and portfolio when jobId is absent", async () => {
    const context = await loadJobApplyCandidateContext(undefined);
    expect(context.jobContext).toBeUndefined();
    expect(context.studioContext).toBeUndefined();
    expect(context.skillContext).toBeUndefined();
    expect(context.profileContext).toBeDefined();
    expect(context.portfolioContext).toBeDefined();
  });

  test("omits job/studio context when jobId does not match a persisted job", async () => {
    const context = await loadJobApplyCandidateContext("nonexistent-job-id");
    expect(context.jobContext).toBeUndefined();
    expect(context.studioContext).toBeUndefined();
    expect(context.profileContext).toBeDefined();
  });
});
