import type { CareerPathway, ReadinessAssessment, SkillMapping } from "@bao/shared";
import { STATE_KEYS, asNumber, asString, asStringArray, isRecord } from "@bao/shared";
import { toSkillMapping } from "./api-normalizers";
import { assertApiResponse, withLoadingState } from "./async-flow";

type ApiClient = ReturnType<typeof useApi>;
type CreateMappingInput = NonNullable<Parameters<ApiClient["skills"]["mappings"]["post"]>[0]>;
type MappingRoute = ReturnType<ApiClient["skills"]["mappings"]>;
type UpdateMappingInput = NonNullable<Parameters<MappingRoute["put"]>[0]>;

const toCareerPathway = (value: unknown): CareerPathway | null => {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  const title = asString(value.title);
  const description = asString(value.description);
  const estimatedTimeToEntry = asString(value.estimatedTimeToEntry);
  if (!id || !title || !description || !estimatedTimeToEntry) return null;

  const stages: CareerPathway["stages"] = [];
  if (Array.isArray(value.stages)) {
    for (const entry of value.stages) {
      if (!isRecord(entry)) continue;
      const stageTitle = asString(entry.title);
      const duration = asString(entry.duration);
      const stageDescription = asString(entry.description);
      if (!stageTitle || !duration || !stageDescription) continue;

      const stage: CareerPathway["stages"][number] = {
        title: stageTitle,
        duration,
        description: stageDescription,
      };

      if (typeof entry.completed === "boolean") {
        stage.completed = entry.completed;
      }
      if (typeof entry.current === "boolean") {
        stage.current = entry.current;
      }

      const requirements = asStringArray(entry.requirements);
      if (requirements.length > 0) {
        stage.requirements = requirements;
      }
      const outcomes = asStringArray(entry.outcomes);
      if (outcomes.length > 0) {
        stage.outcomes = outcomes;
      }

      stages.push(stage);
    }
  }

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
    averageSalary:
      isRecord(value.averageSalary) &&
      typeof value.averageSalary.min === "number" &&
      typeof value.averageSalary.max === "number"
        ? {
            min: value.averageSalary.min,
            max: value.averageSalary.max,
            currency: asString(value.averageSalary.currency),
          }
        : undefined,
    jobMarketTrend:
      value.jobMarketTrend === "growing" ||
      value.jobMarketTrend === "stable" ||
      value.jobMarketTrend === "declining"
        ? value.jobMarketTrend
        : "stable",
  };
};

const toReadinessAssessment = (value: unknown): ReadinessAssessment | null => {
  if (!isRecord(value)) return null;
  if (!isRecord(value.categories)) return null;
  const technical = value.categories.technical;
  const softSkills = value.categories.softSkills;
  const industryKnowledge = value.categories.industryKnowledge;
  const portfolio = value.categories.portfolio;

  const toCategory = (entry: unknown): ReadinessAssessment["categories"]["technical"] | null => {
    if (!isRecord(entry)) return null;
    const score = asNumber(entry.score);
    const feedback = asString(entry.feedback);
    if (score === undefined || !feedback) return null;
    return {
      score,
      feedback,
      strengths: asStringArray(entry.strengths),
      improvements: asStringArray(entry.improvements),
    };
  };

  const technicalCategory = toCategory(technical);
  const softSkillsCategory = toCategory(softSkills);
  const industryKnowledgeCategory = toCategory(industryKnowledge);
  const portfolioCategory = toCategory(portfolio);

  if (
    !technicalCategory ||
    !softSkillsCategory ||
    !industryKnowledgeCategory ||
    !portfolioCategory
  ) {
    return null;
  }

  const targetRoleReadiness: NonNullable<ReadinessAssessment["targetRoleReadiness"]> = [];
  if (Array.isArray(value.targetRoleReadiness)) {
    for (const entry of value.targetRoleReadiness) {
      if (!isRecord(entry)) continue;
      const roleId = asString(entry.roleId);
      const roleTitle = asString(entry.roleTitle);
      if (!roleId || !roleTitle) continue;
      const roleReadiness: NonNullable<ReadinessAssessment["targetRoleReadiness"]>[number] = {
        roleId,
        roleTitle,
        readinessScore: asNumber(entry.readinessScore) ?? 0,
        missingSkills: asStringArray(entry.missingSkills),
        matchingSkills: asStringArray(entry.matchingSkills),
        recommendedActions: asStringArray(entry.recommendedActions),
      };
      const timeToReady = asString(entry.timeToReady);
      if (timeToReady) {
        roleReadiness.timeToReady = timeToReady;
      }
      targetRoleReadiness.push(roleReadiness);
    }
  }

  return {
    overallScore: asNumber(value.overallScore) ?? 0,
    categories: {
      technical: technicalCategory,
      softSkills: softSkillsCategory,
      industryKnowledge: industryKnowledgeCategory,
      portfolio: portfolioCategory,
    },
    improvementSuggestions: asStringArray(value.improvementSuggestions),
    nextSteps: asStringArray(value.nextSteps),
    targetRoleReadiness: targetRoleReadiness.length > 0 ? targetRoleReadiness : undefined,
  };
};

/**
 * Skill mapping and pathway management composable.
 */
export function useSkillMapping() {
  const api = useApi();
  const mappings = useState<SkillMapping[]>(STATE_KEYS.SKILLS_MAPPINGS, () => []);
  const pathways = useState<CareerPathway[]>(STATE_KEYS.SKILLS_PATHWAYS, () => []);
  const readiness = useState<ReadinessAssessment | null>(STATE_KEYS.SKILLS_READINESS, () => null);
  const loading = useState(STATE_KEYS.SKILLS_LOADING, () => false);

  async function fetchMappings() {
    return withLoadingState(loading, async () => {
      const { data, error } = await api.skills.mappings.get();
      assertApiResponse(error, "Failed to fetch skill mappings");
      mappings.value = Array.isArray(data)
        ? data
            .map((entry) => toSkillMapping(entry))
            .filter((entry): entry is SkillMapping => entry !== null)
        : [];
    });
  }

  async function createMapping(mappingData: CreateMappingInput) {
    return withLoadingState(loading, async () => {
      const { data, error } = await api.skills.mappings.post(mappingData);
      assertApiResponse(error, "Failed to create skill mapping");
      await fetchMappings();
      return data;
    });
  }

  async function updateMapping(id: string, updates: UpdateMappingInput) {
    return withLoadingState(loading, async () => {
      const { data, error } = await api.skills.mappings({ id }).put(updates);
      assertApiResponse(error, "Failed to update skill mapping");
      await fetchMappings();
      return data;
    });
  }

  async function deleteMapping(id: string) {
    return withLoadingState(loading, async () => {
      const { error } = await api.skills.mappings({ id }).delete();
      assertApiResponse(error, "Failed to delete skill mapping");
      await fetchMappings();
    });
  }

  async function fetchPathways() {
    return withLoadingState(loading, async () => {
      const { data, error } = await api.skills.pathways.get();
      assertApiResponse(error, "Failed to fetch learning pathways");
      pathways.value = Array.isArray(data)
        ? data
            .map((entry) => toCareerPathway(entry))
            .filter((entry): entry is CareerPathway => entry !== null)
        : [];
    });
  }

  async function fetchReadiness() {
    return withLoadingState(loading, async () => {
      const { data, error } = await api.skills.readiness.get();
      assertApiResponse(error, "Failed to fetch job readiness");
      readiness.value = toReadinessAssessment(data);
    });
  }

  async function aiAnalyze(skills: string[]) {
    return withLoadingState(loading, async () => {
      const { data, error } = await api.skills["ai-analyze"].post({ gameExperience: { skills } });
      assertApiResponse(error, "Failed to analyze skills");
      return data;
    });
  }

  /**
   * Extract skills from raw text using the server-side skill extractor
   */
  async function extractFromText(text: string) {
    return withLoadingState(loading, async () => {
      const { data, error } = await api.skills["ai-analyze"].post({ resume: { experience: text } });
      assertApiResponse(error, "Failed to extract skills from text");
      return data;
    });
  }

  /**
   * Compare user skills against a specific job's requirements
   */
  async function compareWithJob(jobId: string) {
    return withLoadingState(loading, async () => {
      const { data, error } = await api.skills.readiness.get({ query: { jobId } });
      assertApiResponse(error, "Failed to compare skills with job");
      return data;
    });
  }

  return {
    mappings: readonly(mappings),
    pathways: readonly(pathways),
    readiness: readonly(readiness),
    loading: readonly(loading),
    fetchMappings,
    createMapping,
    updateMapping,
    deleteMapping,
    fetchPathways,
    fetchReadiness,
    aiAnalyze,
    extractFromText,
    compareWithJob,
  };
}
