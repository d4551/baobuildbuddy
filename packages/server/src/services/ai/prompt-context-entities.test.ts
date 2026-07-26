import { describe, expect, test } from "bun:test";
import type { InterviewTargetJob } from "@bao/shared/types/interview";
import type { SkillMapping } from "@bao/shared/types/skill-mapping";
import {
  buildJobPromptContext,
  buildSkillPromptContext,
  buildStudioPromptContext,
  JOB_CONTEXT_NOT_PROVIDED,
  SKILL_CONTEXT_NOT_PROVIDED,
  type StudioPromptContext,
} from "./prompt-context-entities";

/**
 * These builders decide whether an AI surface knows anything about the studio, the
 * scraped posting, or the candidate's transferable skills. They had no tests, which
 * is exactly why cover letters shipped asking the model to "demonstrate knowledge of
 * the company" with no company data attached. Each assertion below checks that a
 * specific input fact reaches the prompt text, so dropping context fails loudly.
 */

const STUDIO: StudioPromptContext = {
  name: "Riot Games",
  description: "Developer of League of Legends.",
  interviewStyle: "Technical assessments, portfolio review",
  technologies: ["C++", "C#", "Proprietary Engine"],
  games: ["League of Legends", "Valorant", "Teamfight Tactics", "Legends of Runeterra", "Extra"],
  location: "Los Angeles, CA",
  type: "AAA",
  remoteWork: true,
  enrichment: {
    summary: "Competitive multiplayer specialist",
    hiringSignals: ["Live-service experience", "Netcode depth"],
    interviewFocusAreas: ["Systems design", "Latency"],
    candidatePitchAngles: ["Shipped live ops", "Player-first metrics"],
  },
};

const JOB: InterviewTargetJob = {
  id: "job-1",
  title: "Senior Gameplay Engineer",
  company: "Riot Games",
  location: "Los Angeles, CA",
  description: "Own gameplay systems for a live-service title.",
  requirements: ["5+ years C++", "Multiplayer netcode", "Profiling"],
  technologies: ["C++", "Perforce"],
  source: "greenhouse",
  enrichment: {
    summary: "Live-service gameplay role",
    hiringSignals: ["Netcode"],
    interviewFocusAreas: ["Replication"],
    candidatePitchAngles: ["Shipped multiplayer"],
  },
};

/** More mappings than the builder's six-entry cap, to prove the cap holds. */
const OVER_CAP_SKILL_COUNT = 8;
const MAX_CONFIDENCE = 100;

const buildSkill = (overrides: Partial<SkillMapping>): SkillMapping => ({
  id: "skill-1",
  gameExpression: "Guild raid leadership",
  transferableSkill: "Cross-functional team leadership",
  industryApplications: ["Engineering management", "Live ops coordination"],
  evidence: [],
  confidence: 80,
  category: "leadership",
  demandLevel: "high",
  verified: true,
  ...overrides,
});

describe("buildStudioPromptContext", () => {
  test("includes the studio identity, type and interview style", () => {
    const prompt = buildStudioPromptContext(STUDIO);
    expect(prompt).toContain("Riot Games");
    expect(prompt).toContain("AAA");
    expect(prompt).toContain("Technical assessments, portfolio review");
  });

  test("includes the technology stack the studio actually uses", () => {
    const prompt = buildStudioPromptContext(STUDIO);
    expect(prompt).toContain("C++");
    expect(prompt).toContain("Proprietary Engine");
  });

  test("includes the scraped persona enrichment signals", () => {
    const prompt = buildStudioPromptContext(STUDIO);
    expect(prompt).toContain("Competitive multiplayer specialist");
    expect(prompt).toContain("Live-service experience");
    expect(prompt).toContain("Systems design");
    expect(prompt).toContain("Player-first metrics");
  });

  test("caps key titles at four so prompt budget stays bounded", () => {
    const prompt = buildStudioPromptContext(STUDIO);
    expect(prompt).toContain("Legends of Runeterra");
    expect(prompt).not.toContain("Extra");
  });

  test("labels missing optional studio detail instead of emitting blanks", () => {
    const prompt = buildStudioPromptContext({
      name: "Unknown Studio",
      description: "",
      interviewStyle: "",
      technologies: [],
      games: [],
      location: "",
      type: "",
      remoteWork: false,
    });
    expect(prompt).toContain("Unknown Studio");
    expect(prompt).toContain("primarily on-site");
    expect(prompt).not.toContain("- Technologies: \n");
  });
});

describe("buildJobPromptContext", () => {
  test("includes the posting title, company and description", () => {
    const prompt = buildJobPromptContext(JOB);
    expect(prompt).toContain("Senior Gameplay Engineer");
    expect(prompt).toContain("Riot Games");
    expect(prompt).toContain("Own gameplay systems for a live-service title.");
  });

  test("includes the scraped requirements and source", () => {
    const prompt = buildJobPromptContext(JOB);
    expect(prompt).toContain("5+ years C++");
    expect(prompt).toContain("Multiplayer netcode");
    expect(prompt).toContain("greenhouse");
  });

  test("states absence explicitly so the model cannot invent a posting", () => {
    expect(buildJobPromptContext(null)).toBe(JOB_CONTEXT_NOT_PROVIDED);
    expect(buildJobPromptContext(undefined)).toBe(JOB_CONTEXT_NOT_PROVIDED);
  });

  test("caps requirements at eight entries", () => {
    const prompt = buildJobPromptContext({
      ...JOB,
      requirements: ["r1", "r2", "r3", "r4", "r5", "r6", "r7", "r8", "r9-overflow"],
    });
    expect(prompt).toContain("r8");
    expect(prompt).not.toContain("r9-overflow");
  });
});

describe("buildSkillPromptContext", () => {
  test("includes the game expression, transferable skill and applications", () => {
    const prompt = buildSkillPromptContext([buildSkill({})]);
    expect(prompt).toContain("Guild raid leadership");
    expect(prompt).toContain("Cross-functional team leadership");
    expect(prompt).toContain("Engineering management");
  });

  test("orders by confidence so the strongest translation leads", () => {
    const prompt = buildSkillPromptContext([
      buildSkill({ id: "low", gameExpression: "Low signal", confidence: 20 }),
      buildSkill({ id: "high", gameExpression: "High signal", confidence: 95 }),
    ]);
    expect(prompt.indexOf("High signal")).toBeLessThan(prompt.indexOf("Low signal"));
  });

  test("caps at six mappings", () => {
    const skills = Array.from({ length: OVER_CAP_SKILL_COUNT }, (_unused, index) =>
      buildSkill({
        id: `skill-${String(index)}`,
        gameExpression: `Expression ${String(index)}`,
        confidence: MAX_CONFIDENCE - index,
      }),
    );
    const prompt = buildSkillPromptContext(skills);
    expect(prompt).toContain("Expression 5");
    expect(prompt).not.toContain("Expression 6");
  });

  test("states absence explicitly for an empty mapping set", () => {
    expect(buildSkillPromptContext([])).toBe(SKILL_CONTEXT_NOT_PROVIDED);
  });
});
