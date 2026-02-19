import type { CareerPathway, ReadinessAssessment, SkillMapping } from "@bao/shared";
import { STATE_KEYS } from "@bao/shared";

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
    loading.value = true;
    try {
      const { data, error } = await api.skills.mappings.get();
      if (error) throw new Error("Failed to fetch skill mappings");
      mappings.value = data as SkillMapping[];
    } finally {
      loading.value = false;
    }
  }

  async function createMapping(mappingData: Partial<SkillMapping>) {
    loading.value = true;
    try {
      const { data, error } = await api.skills.mappings.post(mappingData);
      if (error) throw new Error("Failed to create skill mapping");
      await fetchMappings();
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function updateMapping(id: string, updates: Partial<SkillMapping>) {
    loading.value = true;
    try {
      const { data, error } = await api.skills.mappings[id].put(updates);
      if (error) throw new Error("Failed to update skill mapping");
      await fetchMappings();
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function deleteMapping(id: string) {
    loading.value = true;
    try {
      const { error } = await api.skills.mappings[id].delete();
      if (error) throw new Error("Failed to delete skill mapping");
      await fetchMappings();
    } finally {
      loading.value = false;
    }
  }

  async function fetchPathways() {
    loading.value = true;
    try {
      const { data, error } = await api.skills.pathways.get();
      if (error) throw new Error("Failed to fetch learning pathways");
      pathways.value = data as CareerPathway[];
    } finally {
      loading.value = false;
    }
  }

  async function fetchReadiness() {
    loading.value = true;
    try {
      const { data, error } = await api.skills.readiness.get();
      if (error) throw new Error("Failed to fetch job readiness");
      readiness.value = data as ReadinessAssessment;
    } finally {
      loading.value = false;
    }
  }

  async function aiAnalyze(skills: string[]) {
    loading.value = true;
    try {
      const { data, error } = await api.skills["ai-analyze"].post({ gameExperience: { skills } });
      if (error) throw new Error("Failed to analyze skills");
      return data;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Extract skills from raw text using the server-side skill extractor
   */
  async function extractFromText(text: string) {
    loading.value = true;
    try {
      const { data, error } = await api.skills["ai-analyze"].post({ resume: { experience: text } });
      if (error) throw new Error("Failed to extract skills from text");
      return data;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Compare user skills against a specific job's requirements
   */
  async function compareWithJob(jobId: string) {
    loading.value = true;
    try {
      const { data, error } = await api.skills.readiness.get({ query: { jobId } });
      if (error) throw new Error("Failed to compare skills with job");
      return data;
    } finally {
      loading.value = false;
    }
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
