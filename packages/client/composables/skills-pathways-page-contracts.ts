import type { ReadinessAssessment, SkillReadinessFeedbackId } from "@bao/shared";

export type ReadinessCategoryKey = "technical" | "softSkills" | "industryKnowledge" | "portfolio";

export interface ReadinessCategoryStat {
  readonly key: ReadinessCategoryKey;
  readonly score: number;
  readonly feedbackId: SkillReadinessFeedbackId;
}

export const READINESS_CATEGORY_LABEL_KEYS: Record<ReadinessCategoryKey, string> = {
  technical: "skillsPathwaysPage.categories.technical",
  softSkills: "skillsPathwaysPage.categories.softSkills",
  industryKnowledge: "skillsPathwaysPage.categories.industryKnowledge",
  portfolio: "skillsPathwaysPage.categories.portfolio",
};

export const READINESS_CATEGORY_KEYS = [
  "technical",
  "softSkills",
  "industryKnowledge",
  "portfolio",
] as const satisfies readonly ReadinessCategoryKey[];

export type ReadinessImprovementItem = ReadinessAssessment["improvementSuggestions"][number];
export type ReadinessNextStepItem = ReadinessAssessment["nextSteps"][number];
