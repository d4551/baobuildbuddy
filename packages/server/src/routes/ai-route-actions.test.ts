import { afterAll, beforeAll, describe, expect, spyOn, test } from "bun:test";
import { HTTP_STATUS_OK } from "@bao/shared/constants/http";
import type { AIResponse } from "@bao/shared/types/ai";
import { generateId } from "@bao/shared/utils/validation";
import { db, sqlite } from "../db/client";
import { initializeDatabase } from "../db/init";
import { jobs } from "../db/schema/jobs";
import { resumes } from "../db/schema/resumes";
import { skillMappings } from "../db/schema/skill-mappings";
import { studios } from "../db/schema/studios";
import { AIService } from "../services/ai/ai-service";
import { handleAnalyzeResumeRoute, handleGenerateCoverLetterRoute } from "./ai-route-actions";

const MOCK_ANALYSIS_SCORE = 88;

const cleanTables = async () => {
  await db.delete(skillMappings);
  await db.delete(jobs);
  await db.delete(studios);
  await db.delete(resumes);
};

beforeAll(async () => {
  initializeDatabase(sqlite);
  await cleanTables();
});

afterAll(async () => {
  await cleanTables();
});

const seedResume = async (): Promise<string> => {
  const resumeId = generateId();
  await db.insert(resumes).values({
    id: resumeId,
    name: "Test Resume",
    personalInfo: { name: "Test Candidate", email: "test@example.test" },
    summary: "Gameplay engineer with C++ and Unreal Engine experience.",
    skills: { technical: ["C++", "Unreal Engine"] },
    isDefault: true,
  });
  return resumeId;
};

const seedJobAndStudio = async (): Promise<string> => {
  const jobId = generateId();
  await db.insert(jobs).values({
    id: jobId,
    title: "Senior Gameplay Engineer",
    company: "Parity Studio",
    location: "Remote",
    description: "Build gameplay systems in Unreal Engine and C++.",
    requirements: ["C++", "Unreal Engine"],
    technologies: ["Unreal Engine", "Git"],
    postedDate: new Date().toISOString(),
  });
  await db.insert(studios).values({
    id: generateId(),
    name: "Parity Studio",
    description: "Parity Studio ships award-winning indie games.",
    technologies: ["Unreal Engine"],
    games: ["Parity Game"],
  });
  await db.insert(skillMappings).values({
    id: generateId(),
    gameExpression: "Shipped a C++ title",
    transferableSkill: "C++",
    industryApplications: ["Systems programming"],
    evidence: [],
    confidence: 85,
    category: "technical",
    demandLevel: "high",
    aiGenerated: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return jobId;
};

const mockCoverLetterResponse: AIResponse = {
  id: "mock-cl-1",
  content: JSON.stringify({
    introduction: "Intro",
    body: "Body",
    conclusion: "Conclusion",
  }),
  provider: "local",
  model: "mock-model",
};

const mockAnalyzeResponse: AIResponse = {
  id: "mock-ar-1",
  content: JSON.stringify({
    score: MOCK_ANALYSIS_SCORE,
    strengths: ["C++"],
    improvements: ["Add more"],
    keywords: ["C++"],
  }),
  provider: "local",
  model: "mock-model",
};

describe("handleGenerateCoverLetterRoute entity-context parity", () => {
  test("loads job, studio, and skill context into the prompt when jobId is provided", async () => {
    const resumeId = await seedResume();
    const jobId = await seedJobAndStudio();

    const generateSpy = spyOn(AIService.prototype, "generate").mockResolvedValue(
      mockCoverLetterResponse,
    );

    const result = await handleGenerateCoverLetterRoute({
      resumeId,
      jobId,
      company: "Parity Studio",
      position: "Senior Gameplay Engineer",
    });

    expect(result.status).toBe(HTTP_STATUS_OK);
    expect(generateSpy).toHaveBeenCalledTimes(1);
    const prompt = generateSpy.mock.calls[0][0];
    expect(prompt).toContain("Job context:");
    expect(prompt).toContain("Senior Gameplay Engineer");
    expect(prompt).toContain("Studio context:");
    expect(prompt).toContain("Parity Studio");
    expect(prompt).toContain("Transferable skill context:");
    expect(prompt).toContain("C++");

    generateSpy.mockRestore();
  });

  test("omits job/studio context when jobId is absent (no false context)", async () => {
    const resumeId = await seedResume();
    const generateSpy = spyOn(AIService.prototype, "generate").mockResolvedValue(
      mockCoverLetterResponse,
    );

    const result = await handleGenerateCoverLetterRoute({
      resumeId,
      company: "Some Company",
      position: "Engineer",
    });

    expect(result.status).toBe(HTTP_STATUS_OK);
    const prompt = generateSpy.mock.calls[0][0];
    expect(prompt).not.toContain("Job context:");
    expect(prompt).not.toContain("Studio context:");

    generateSpy.mockRestore();
  });
});

describe("handleAnalyzeResumeRoute entity-context parity", () => {
  test("enriches the job description with studio and skill context when jobId is provided", async () => {
    const resumeId = await seedResume();
    const jobId = await seedJobAndStudio();

    const generateSpy = spyOn(AIService.prototype, "generate").mockResolvedValue(
      mockAnalyzeResponse,
    );

    const result = await handleAnalyzeResumeRoute({ resumeId, jobId });

    expect(result.status).toBe(HTTP_STATUS_OK);
    const prompt = generateSpy.mock.calls[0][0];
    expect(prompt).toContain("Senior Gameplay Engineer");
    expect(prompt).toContain("Studio context:");
    expect(prompt).toContain("Parity Studio");
    expect(prompt).toContain("Transferable skill context:");

    generateSpy.mockRestore();
  });
});
