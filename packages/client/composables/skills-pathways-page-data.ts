import {
  type CareerPathway,
  type ReadinessAssessment,
  SKILL_READINESS_FEEDBACK_IDS,
  SKILL_READINESS_IMPROVEMENT_IDS,
  SKILL_READINESS_NEXT_STEP_IDS,
  type SkillReadinessFeedbackId,
  type SkillReadinessImprovementId,
  type SkillReadinessNextStepId,
} from "@bao/shared/types/skill-mapping";
import { isRecord } from "@bao/shared/utils/type-guards";

export interface SkillsPathwaysBootstrapData {
  readonly pathways: readonly CareerPathway[];
  readonly readiness: ReadinessAssessment;
}

export interface SkillsPathwaysGamificationProgress {
  readonly level?: number;
  readonly xp?: number;
}

const toSkillReadinessFeedbackId = (value: unknown): SkillReadinessFeedbackId | null => {
  if (typeof value !== "string") {
    return null;
  }
  return isSkillReadinessFeedbackId(value) ? value : null;
};

const isSkillReadinessFeedbackId = (value: string): value is SkillReadinessFeedbackId =>
  SKILL_READINESS_FEEDBACK_IDS.some((entry) => entry === value);

const isSkillReadinessImprovementId = (value: string): value is SkillReadinessImprovementId =>
  SKILL_READINESS_IMPROVEMENT_IDS.some((entry) => entry === value);

const isSkillReadinessNextStepId = (value: string): value is SkillReadinessNextStepId =>
  SKILL_READINESS_NEXT_STEP_IDS.some((entry) => entry === value);

const toCareerSalary = (value: unknown): CareerPathway["averageSalary"] => {
  if (!(isRecord(value) && typeof value.min === "number" && typeof value.max === "number")) {
    return;
  }

  return {
    min: value.min,
    max: value.max,
    currency: typeof value.currency === "string" ? value.currency : undefined,
  };
};

const toCareerStage = (value: unknown): CareerPathway["stages"][number] | null => {
  if (!isRecord(value)) {
    return null;
  }

  const title = typeof value.title === "string" ? value.title : undefined;
  const duration = typeof value.duration === "string" ? value.duration : undefined;
  const description = typeof value.description === "string" ? value.description : undefined;
  if (!(title && duration && description)) {
    return null;
  }

  const stage: CareerPathway["stages"][number] = { title, duration, description };
  if (typeof value.completed === "boolean") {
    stage.completed = value.completed;
  }
  if (typeof value.current === "boolean") {
    stage.current = value.current;
  }
  if (Array.isArray(value.requirements)) {
    stage.requirements = value.requirements.filter(
      (entry): entry is string => typeof entry === "string",
    );
  }
  if (Array.isArray(value.outcomes)) {
    stage.outcomes = value.outcomes.filter((entry): entry is string => typeof entry === "string");
  }

  return stage;
};

const toCareerPathway = (value: unknown): CareerPathway | null => {
  if (!isRecord(value)) {
    return null;
  }

  const id = typeof value.id === "string" ? value.id : undefined;
  const title = typeof value.title === "string" ? value.title : undefined;
  const description = typeof value.description === "string" ? value.description : undefined;
  const estimatedTimeToEntry =
    typeof value.estimatedTimeToEntry === "string" ? value.estimatedTimeToEntry : undefined;
  if (!(id && title && description && estimatedTimeToEntry)) {
    return null;
  }

  const stages = Array.isArray(value.stages)
    ? value.stages
        .map((entry) => toCareerStage(entry))
        .filter((entry): entry is CareerPathway["stages"][number] => entry !== null)
    : [];
  const trend = typeof value.jobMarketTrend === "string" ? value.jobMarketTrend : undefined;

  return {
    id,
    title,
    description,
    detailedDescription:
      typeof value.detailedDescription === "string" ? value.detailedDescription : undefined,
    matchScore: typeof value.matchScore === "number" ? value.matchScore : 0,
    stages,
    requiredSkills: Array.isArray(value.requiredSkills)
      ? value.requiredSkills.filter((entry): entry is string => typeof entry === "string")
      : [],
    estimatedTimeToEntry,
    icon: typeof value.icon === "string" ? value.icon : undefined,
    averageSalary: toCareerSalary(value.averageSalary),
    jobMarketTrend:
      trend === "growing" || trend === "stable" || trend === "declining" ? trend : "stable",
  };
};

const toReadinessCategory = (
  value: unknown,
): ReadinessAssessment["categories"]["technical"] | null => {
  if (!(isRecord(value) && typeof value.score === "number")) {
    return null;
  }
  const feedbackId = toSkillReadinessFeedbackId(value.feedbackId);
  if (!feedbackId) {
    return null;
  }

  return {
    score: value.score,
    feedbackId,
    strengths: Array.isArray(value.strengths)
      ? value.strengths.filter((entry): entry is string => typeof entry === "string")
      : [],
    improvements: Array.isArray(value.improvements)
      ? value.improvements.filter(
          (entry): entry is SkillReadinessImprovementId =>
            typeof entry === "string" && isSkillReadinessImprovementId(entry),
        )
      : [],
  };
};

const toTargetRoleReadiness = (
  value: unknown,
): NonNullable<ReadinessAssessment["targetRoleReadiness"]> =>
  Array.isArray(value)
    ? value
        .map((entry) => toRoleReadiness(entry))
        .filter(
          (entry): entry is NonNullable<ReadinessAssessment["targetRoleReadiness"]>[number] =>
            entry !== null,
        )
    : [];

const toRoleReadiness = (
  entry: unknown,
): NonNullable<ReadinessAssessment["targetRoleReadiness"]>[number] | null => {
  if (!isRecord(entry)) {
    return null;
  }
  const roleId = typeof entry.roleId === "string" ? entry.roleId : undefined;
  const roleTitle = typeof entry.roleTitle === "string" ? entry.roleTitle : undefined;
  if (!(roleId && roleTitle)) {
    return null;
  }

  const readiness: NonNullable<ReadinessAssessment["targetRoleReadiness"]>[number] = {
    roleId,
    roleTitle,
    readinessScore: typeof entry.readinessScore === "number" ? entry.readinessScore : 0,
    missingSkills: Array.isArray(entry.missingSkills)
      ? entry.missingSkills.filter((skill): skill is string => typeof skill === "string")
      : [],
    matchingSkills: Array.isArray(entry.matchingSkills)
      ? entry.matchingSkills.filter((skill): skill is string => typeof skill === "string")
      : [],
    recommendedActions: Array.isArray(entry.recommendedActions)
      ? entry.recommendedActions.filter((action): action is string => typeof action === "string")
      : [],
  };
  if (typeof entry.timeToReady === "string") {
    readiness.timeToReady = entry.timeToReady;
  }
  return readiness;
};

const toReadinessAssessment = (value: unknown): ReadinessAssessment | null => {
  if (!(isRecord(value) && isRecord(value.categories))) {
    return null;
  }

  const categories = value.categories;
  const technical = toReadinessCategory(categories.technical);
  const softSkills = toReadinessCategory(categories.softSkills);
  const industryKnowledge = toReadinessCategory(categories.industryKnowledge);
  const portfolio = toReadinessCategory(categories.portfolio);
  if (!(technical && softSkills && industryKnowledge && portfolio)) {
    return null;
  }

  return {
    overallScore: typeof value.overallScore === "number" ? value.overallScore : 0,
    categories: {
      technical,
      softSkills,
      industryKnowledge,
      portfolio,
    },
    improvementSuggestions: Array.isArray(value.improvementSuggestions)
      ? value.improvementSuggestions.filter(
          (entry): entry is SkillReadinessImprovementId =>
            typeof entry === "string" && isSkillReadinessImprovementId(entry),
        )
      : [],
    nextSteps: Array.isArray(value.nextSteps)
      ? value.nextSteps.filter(
          (entry): entry is SkillReadinessNextStepId =>
            typeof entry === "string" && isSkillReadinessNextStepId(entry),
        )
      : [],
    targetRoleReadiness: toTargetRoleReadiness(value.targetRoleReadiness),
  };
};

export const toSkillsPathwaysBootstrapData = (
  value: unknown,
): SkillsPathwaysBootstrapData | null => {
  if (!(isRecord(value) && Array.isArray(value.pathways) && isRecord(value.readiness))) {
    return null;
  }

  const pathways = value.pathways
    .map((entry) => toCareerPathway(entry))
    .filter((entry): entry is CareerPathway => entry !== null);
  const readiness = toReadinessAssessment(value.readiness);
  if (!readiness) {
    return null;
  }

  return {
    pathways,
    readiness,
  };
};

export const toGamificationProgress = (
  value: unknown,
): SkillsPathwaysGamificationProgress | null => {
  if (!isRecord(value)) {
    return null;
  }
  const level = typeof value.level === "number" ? value.level : undefined;
  const xp = typeof value.xp === "number" ? value.xp : undefined;
  return level === undefined && xp === undefined ? null : { level, xp };
};
