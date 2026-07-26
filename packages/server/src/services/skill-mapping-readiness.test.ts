import { describe, expect, test } from "bun:test";
import type { SkillMapping } from "@bao/shared/types/skill-mapping";
import {
  buildRoleReadiness,
  buildSkillReadinessAssessment,
  buildSkillReadinessAssessmentForJob,
  type ReadinessJobTarget,
} from "./skill-mapping-readiness";

const DEFAULT_MAPPING_CONFIDENCE = 80;
const HALF_COVERAGE_SCORE = 50;
const FULL_COVERAGE_SCORE = 100;
const ALL_SKILLS_MATCHING_COUNT = 4;

const buildMapping = (overrides: Partial<SkillMapping> = {}): SkillMapping => ({
  id: overrides.id ?? "mapping-1",
  gameExpression: overrides.gameExpression ?? "Led a raid team of 40 players",
  transferableSkill: overrides.transferableSkill ?? "Leadership",
  industryApplications: overrides.industryApplications ?? ["Team leadership"],
  evidence: overrides.evidence ?? [],
  confidence: overrides.confidence ?? DEFAULT_MAPPING_CONFIDENCE,
  category: overrides.category ?? "leadership",
  demandLevel: overrides.demandLevel ?? "high",
  verified: overrides.verified ?? false,
});

const buildJob = (overrides: Partial<ReadinessJobTarget> = {}): ReadinessJobTarget => ({
  id: overrides.id ?? "job-1",
  title: overrides.title ?? "Senior Gameplay Engineer",
  requirements: overrides.requirements ?? ["C++", "Leadership", "Unreal Engine"],
  technologies: overrides.technologies ?? ["Unreal Engine", "Git"],
});

describe("buildRoleReadiness", () => {
  test("splits job requirements and technologies into matching and missing skills", () => {
    const mappings = [
      buildMapping({
        id: "mapping-leadership",
        transferableSkill: "Leadership",
        gameExpression: "Led a raid team",
      }),
      buildMapping({
        id: "mapping-cpp",
        transferableSkill: "C++",
        gameExpression: "Shipped a C++ game",
      }),
    ];
    const roleReadiness = buildRoleReadiness(buildJob(), mappings);

    expect(roleReadiness.roleId).toBe("job-1");
    expect(roleReadiness.roleTitle).toBe("Senior Gameplay Engineer");
    // C++ and Leadership are covered; Unreal Engine (req + tech deduped) and Git are missing.
    expect(roleReadiness.matchingSkills).toContain("c++");
    expect(roleReadiness.matchingSkills).toContain("leadership");
    expect(roleReadiness.missingSkills).toContain("unreal engine");
    expect(roleReadiness.missingSkills).toContain("git");
    // 2 of 4 unique skills (c++, leadership, unreal engine, git) covered.
    expect(roleReadiness.readinessScore).toBe(HALF_COVERAGE_SCORE);
    expect(roleReadiness.timeToReady).toBeDefined();
    expect(roleReadiness.recommendedActions.length).toBeGreaterThan(0);
  });

  test("returns 100 readiness when every requirement and technology is covered", () => {
    const mappings = [
      buildMapping({ transferableSkill: "C++" }),
      buildMapping({ transferableSkill: "Leadership" }),
      buildMapping({ transferableSkill: "Unreal Engine" }),
      buildMapping({ transferableSkill: "Git" }),
    ];
    const roleReadiness = buildRoleReadiness(buildJob(), mappings);
    expect(roleReadiness.readinessScore).toBe(FULL_COVERAGE_SCORE);
    expect(roleReadiness.missingSkills).toEqual([]);
    expect(roleReadiness.matchingSkills.length).toBe(ALL_SKILLS_MATCHING_COUNT);
  });

  test("returns 0 readiness when no mappings cover the job", () => {
    const roleReadiness = buildRoleReadiness(buildJob(), []);
    expect(roleReadiness.readinessScore).toBe(0);
    expect(roleReadiness.matchingSkills).toEqual([]);
    expect(roleReadiness.missingSkills.length).toBeGreaterThan(0);
  });

  test("dedupes overlapping requirements and technologies", () => {
    const job = buildJob({
      requirements: ["C++"],
      technologies: ["c++", "C++"],
    });
    const roleReadiness = buildRoleReadiness(job, [buildMapping({ transferableSkill: "C++" })]);
    expect(roleReadiness.matchingSkills).toEqual(["c++"]);
    expect(roleReadiness.readinessScore).toBe(FULL_COVERAGE_SCORE);
  });

  test("matches via gameExpression and industryApplications, not only transferableSkill", () => {
    const mappings = [
      buildMapping({
        transferableSkill: "Something unrelated",
        gameExpression: "Unreal Engine blueprints",
        industryApplications: [],
      }),
    ];
    const roleReadiness = buildRoleReadiness(buildJob(), mappings);
    expect(roleReadiness.matchingSkills).toContain("unreal engine");
  });
});

describe("buildSkillReadinessAssessmentForJob", () => {
  test("returns base assessment plus targetRoleReadiness populated from the job", () => {
    const mappings = [buildMapping({ transferableSkill: "C++" })];
    const assessment = buildSkillReadinessAssessmentForJob(mappings, buildJob());

    expect(assessment.overallScore).toBeGreaterThanOrEqual(0);
    expect(assessment.targetRoleReadiness).toBeDefined();
    expect(assessment.targetRoleReadiness).toHaveLength(1);
    expect(assessment.targetRoleReadiness?.[0].roleId).toBe("job-1");
    expect(assessment.targetRoleReadiness?.[0].matchingSkills).toContain("c++");
  });

  test("falls back to empty assessment when mappings are empty but still reports role readiness", () => {
    const assessment = buildSkillReadinessAssessmentForJob([], buildJob());
    expect(assessment.overallScore).toBe(0);
    expect(assessment.targetRoleReadiness?.[0].readinessScore).toBe(0);
    expect(assessment.targetRoleReadiness?.[0].missingSkills.length).toBeGreaterThan(0);
  });

  test("buildSkillReadinessAssessment without job does not populate targetRoleReadiness", () => {
    const assessment = buildSkillReadinessAssessment([buildMapping()]);
    expect(assessment.targetRoleReadiness).toBeUndefined();
  });
});
