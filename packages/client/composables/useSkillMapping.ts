import type {
  CareerPathway,
  ReadinessAssessment,
  SkillMapping,
  SkillReadinessFeedbackId,
  SkillReadinessImprovementId,
  SkillReadinessNextStepId,
} from "@bao/shared";
import {
  asNumber,
  asString,
  asStringArray,
  isRecord,
  SKILL_READINESS_FEEDBACK_IDS,
  SKILL_READINESS_IMPROVEMENT_IDS,
  SKILL_READINESS_NEXT_STEP_IDS,
  STATE_KEYS,
} from "@bao/shared";
import { useI18n } from "vue-i18n";
import { toSkillMapping } from "./api-normalizer-skills";
import { assertApiResponse, withLoadingState } from "./async-flow";

type ApiClient = ReturnType<typeof useApi>;
type CreateMappingInput = NonNullable<Parameters<ApiClient["skills"]["mappings"]["post"]>[0]>;
type MappingRoute = ReturnType<ApiClient["skills"]["mappings"]>;
type UpdateMappingInput = NonNullable<Parameters<MappingRoute["put"]>[0]>;

type ReadinessCategory = ReadinessAssessment["categories"]["technical"];

interface SkillMappingContext {
  api: ApiClient;
  t: ReturnType<typeof useI18n>["t"];
  loading: ReturnType<typeof useState<boolean>>;
  mappings: ReturnType<typeof useState<SkillMapping[]>>;
  pathways: ReturnType<typeof useState<CareerPathway[]>>;
  readiness: ReturnType<typeof useState<ReadinessAssessment | null>>;
}

const SKILL_READINESS_FEEDBACK_ID_SET = new Set<string>(SKILL_READINESS_FEEDBACK_IDS);
const SKILL_READINESS_IMPROVEMENT_ID_SET = new Set<string>(SKILL_READINESS_IMPROVEMENT_IDS);
const SKILL_READINESS_NEXT_STEP_ID_SET = new Set<string>(SKILL_READINESS_NEXT_STEP_IDS);

function isSkillReadinessFeedbackId(value: string): value is SkillReadinessFeedbackId {
  return SKILL_READINESS_FEEDBACK_ID_SET.has(value);
}

function toSkillReadinessFeedbackId(value: unknown): SkillReadinessFeedbackId | null {
  const feedbackId = asString(value);
  if (!(feedbackId && isSkillReadinessFeedbackId(feedbackId))) {
    return null;
  }
  return feedbackId;
}

function toSkillReadinessImprovementIds(value: unknown): SkillReadinessImprovementId[] {
  return asStringArray(value).filter((entry): entry is SkillReadinessImprovementId =>
    SKILL_READINESS_IMPROVEMENT_ID_SET.has(entry),
  );
}

function toSkillReadinessNextStepIds(value: unknown): SkillReadinessNextStepId[] {
  return asStringArray(value).filter((entry): entry is SkillReadinessNextStepId =>
    SKILL_READINESS_NEXT_STEP_ID_SET.has(entry),
  );
}

function toCareerSalary(value: unknown): CareerPathway["averageSalary"] {
  if (isRecord(value) && typeof value.min === "number" && typeof value.max === "number") {
    return {
      min: value.min,
      max: value.max,
      currency: asString(value.currency),
    };
  }
  return;
}

function toCareerStage(entry: unknown): CareerPathway["stages"][number] | null {
  if (!isRecord(entry)) {
    return null;
  }

  const title = asString(entry.title);
  const duration = asString(entry.duration);
  const description = asString(entry.description);
  if (!(title && duration && description)) {
    return null;
  }

  const stage: CareerPathway["stages"][number] = { title, duration, description };
  if (typeof entry.completed === "boolean") {
    stage.completed = entry.completed;
  }
  if (typeof entry.current === "boolean") {
    stage.current = entry.current;
  }

  const requirements = asStringArray(entry.requirements);
  const outcomes = asStringArray(entry.outcomes);
  if (requirements.length > 0) {
    stage.requirements = requirements;
  }
  if (outcomes.length > 0) {
    stage.outcomes = outcomes;
  }

  return stage;
}

function toCareerPathway(value: unknown): CareerPathway | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = asString(value.id);
  const title = asString(value.title);
  const description = asString(value.description);
  const estimatedTimeToEntry = asString(value.estimatedTimeToEntry);
  if (!(id && title && description && estimatedTimeToEntry)) {
    return null;
  }

  const stages = Array.isArray(value.stages)
    ? value.stages
        .map((entry) => toCareerStage(entry))
        .filter((entry): entry is CareerPathway["stages"][number] => entry !== null)
    : [];
  const trend = value.jobMarketTrend;

  return {
    id,
    title,
    description,
    detailedDescription: asString(value.detailedDescription),
    matchScore: asNumber(value.matchScore) ?? 0,
    stages,
    requiredSkills: asStringArray(value.requiredSkills),
    estimatedTimeToEntry,
    icon: asString(value.icon),
    averageSalary: toCareerSalary(value.averageSalary),
    jobMarketTrend:
      trend === "growing" || trend === "stable" || trend === "declining" ? trend : "stable",
  };
}

function toReadinessCategory(entry: unknown): ReadinessCategory | null {
  if (!isRecord(entry)) {
    return null;
  }

  const score = asNumber(entry.score);
  const feedbackId = toSkillReadinessFeedbackId(entry.feedbackId);
  if (score === undefined || feedbackId === null) {
    return null;
  }

  return {
    score,
    feedbackId,
    strengths: asStringArray(entry.strengths),
    improvements: toSkillReadinessImprovementIds(entry.improvements),
  };
}

function toTargetRoleReadiness(
  value: unknown,
): NonNullable<ReadinessAssessment["targetRoleReadiness"]> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!isRecord(entry)) {
        return null;
      }
      const roleId = asString(entry.roleId);
      const roleTitle = asString(entry.roleTitle);
      if (!(roleId && roleTitle)) {
        return null;
      }

      const readiness: NonNullable<ReadinessAssessment["targetRoleReadiness"]>[number] = {
        roleId,
        roleTitle,
        readinessScore: asNumber(entry.readinessScore) ?? 0,
        missingSkills: asStringArray(entry.missingSkills),
        matchingSkills: asStringArray(entry.matchingSkills),
        recommendedActions: asStringArray(entry.recommendedActions),
      };
      const timeToReady = asString(entry.timeToReady);
      if (timeToReady) {
        readiness.timeToReady = timeToReady;
      }
      return readiness;
    })
    .filter(
      (entry): entry is NonNullable<ReadinessAssessment["targetRoleReadiness"]>[number] =>
        entry !== null,
    );
}

function toReadinessAssessment(value: unknown): ReadinessAssessment | null {
  if (!(isRecord(value) && isRecord(value.categories))) {
    return null;
  }

  const technical = toReadinessCategory(value.categories.technical);
  const softSkills = toReadinessCategory(value.categories.softSkills);
  const industryKnowledge = toReadinessCategory(value.categories.industryKnowledge);
  const portfolio = toReadinessCategory(value.categories.portfolio);
  if (!(technical && softSkills && industryKnowledge && portfolio)) {
    return null;
  }

  const targetRoleReadiness = toTargetRoleReadiness(value.targetRoleReadiness);
  return {
    overallScore: asNumber(value.overallScore) ?? 0,
    categories: {
      technical,
      softSkills,
      industryKnowledge,
      portfolio,
    },
    improvementSuggestions: toSkillReadinessImprovementIds(value.improvementSuggestions),
    nextSteps: toSkillReadinessNextStepIds(value.nextSteps),
    targetRoleReadiness: targetRoleReadiness.length > 0 ? targetRoleReadiness : undefined,
  };
}

function createSkillMappingActions(context: SkillMappingContext) {
  const fetchMappings = async () =>
    withLoadingState(context.loading, async () => {
      const { data, error } = await context.api.skills.mappings.get();
      assertApiResponse(error, context.t("apiErrors.skills.fetchMappingsFailed"));
      context.mappings.value = Array.isArray(data)
        ? data
            .map((entry) => toSkillMapping(entry))
            .filter((entry): entry is SkillMapping => entry !== null)
        : [];
    });

  const createMapping = async (mappingData: CreateMappingInput) =>
    withLoadingState(context.loading, async () => {
      const { data, error } = await context.api.skills.mappings.post(mappingData);
      assertApiResponse(error, context.t("apiErrors.skills.createMappingFailed"));
      await fetchMappings();
      return data;
    });

  const updateMapping = async (id: string, updates: UpdateMappingInput) =>
    withLoadingState(context.loading, async () => {
      const { data, error } = await context.api.skills.mappings({ id }).put(updates);
      assertApiResponse(error, context.t("apiErrors.skills.updateMappingFailed"));
      await fetchMappings();
      return data;
    });

  const deleteMapping = async (id: string) =>
    withLoadingState(context.loading, async () => {
      const { error } = await context.api.skills.mappings({ id }).delete();
      assertApiResponse(error, context.t("apiErrors.skills.deleteMappingFailed"));
      await fetchMappings();
    });

  return {
    fetchMappings,
    createMapping,
    updateMapping,
    deleteMapping,
  };
}

function createSkillInsightActions(context: SkillMappingContext) {
  const fetchPathways = async () =>
    withLoadingState(context.loading, async () => {
      const { data, error } = await context.api.skills.pathways.get();
      assertApiResponse(error, context.t("apiErrors.skills.fetchPathwaysFailed"));
      context.pathways.value = Array.isArray(data)
        ? data
            .map((entry) => toCareerPathway(entry))
            .filter((entry): entry is CareerPathway => entry !== null)
        : [];
    });

  const fetchReadiness = async () =>
    withLoadingState(context.loading, async () => {
      const { data, error } = await context.api.skills.readiness.get();
      assertApiResponse(error, context.t("apiErrors.skills.fetchReadinessFailed"));
      context.readiness.value = toReadinessAssessment(data);
    });

  const aiAnalyze = async (skills: string[]) =>
    withLoadingState(context.loading, async () => {
      const { data, error } = await context.api.skills["ai-analyze"].post({
        gameExperience: { skills },
      });
      assertApiResponse(error, context.t("apiErrors.skills.analyzeFailed"));
      return data;
    });

  const extractFromText = async (text: string) =>
    withLoadingState(context.loading, async () => {
      const { data, error } = await context.api.skills["ai-analyze"].post({
        resume: { experience: text },
      });
      assertApiResponse(error, context.t("apiErrors.skills.extractFailed"));
      return data;
    });

  const compareWithJob = async (jobId: string) =>
    withLoadingState(context.loading, async () => {
      const { data, error } = await context.api.skills.readiness.get({ query: { jobId } });
      assertApiResponse(error, context.t("apiErrors.skills.compareFailed"));
      return data;
    });

  return {
    fetchPathways,
    fetchReadiness,
    aiAnalyze,
    extractFromText,
    compareWithJob,
  };
}

/**
 * Skill mapping and pathway management composable.
 */
export function useSkillMapping() {
  const context: SkillMappingContext = {
    api: useApi(),
    t: useI18n().t,
    mappings: useState<SkillMapping[]>(STATE_KEYS.SKILLS_MAPPINGS, () => []),
    pathways: useState<CareerPathway[]>(STATE_KEYS.SKILLS_PATHWAYS, () => []),
    readiness: useState<ReadinessAssessment | null>(STATE_KEYS.SKILLS_READINESS, () => null),
    loading: useState(STATE_KEYS.SKILLS_LOADING, () => false),
  };

  return {
    mappings: readonly(context.mappings),
    pathways: readonly(context.pathways),
    readiness: readonly(context.readiness),
    loading: readonly(context.loading),
    ...createSkillMappingActions(context),
    ...createSkillInsightActions(context),
  };
}
