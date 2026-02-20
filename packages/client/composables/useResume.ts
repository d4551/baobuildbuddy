import type { ResumeData, ResumeTemplate } from "@bao/shared";
import { STATE_KEYS } from "@bao/shared";
import { getStoredApiKey } from "~/plugins/eden";
import { toResumeData } from "./api-normalizers";

type ApiClient = ReturnType<typeof useApi>;
type CreateResumeInput = NonNullable<Parameters<ApiClient["resumes"]["post"]>[0]>;
type ResumeRoute = ReturnType<ApiClient["resumes"]>;
type UpdateResumeInput = NonNullable<Parameters<ResumeRoute["put"]>[0]>;
type ExportResumeInput = NonNullable<Parameters<ResumeRoute["export"]["post"]>[0]>;
type ScoreResumeInput = NonNullable<Parameters<ResumeRoute["ai-score"]["post"]>[0]>;

type ResumeSynthesisSuccess = Partial<ResumeData> & {
  id: string;
  name?: string;
  personalInfo?: ResumeData["personalInfo"];
};

type ResumeSynthesisError = {
  error?: string;
  details?: string;
};

const isResumeSynthesisError = (
  value: ResumeSynthesisSuccess | ResumeSynthesisError,
): value is ResumeSynthesisError => "error" in value && typeof value.error === "string";

/**
 * Resume management composable.
 */
export function useResume() {
  const api = useApi();
  const resumes = useState<ResumeData[]>(STATE_KEYS.RESUME_LIST, () => []);
  const currentResume = useState<ResumeData | null>(STATE_KEYS.RESUME_CURRENT, () => null);
  const loading = useState(STATE_KEYS.RESUME_LOADING, () => false);

  async function fetchResumes() {
    loading.value = true;
    try {
      const { data, error } = await api.resumes.get();
      if (error) throw new Error("Failed to fetch resumes");
      resumes.value = Array.isArray(data)
        ? data
            .map((entry) => toResumeData(entry))
            .filter((entry): entry is ResumeData => entry !== null)
        : [];
    } finally {
      loading.value = false;
    }
  }

  async function getResume(id: string) {
    loading.value = true;
    try {
      const { data, error } = await api.resumes({ id }).get();
      if (error) throw new Error("Failed to fetch resume");
      const normalized = toResumeData(data);
      if (!normalized) throw new Error("Invalid resume payload");
      currentResume.value = normalized;
      return normalized;
    } finally {
      loading.value = false;
    }
  }

  async function createResume(resumeData: CreateResumeInput) {
    loading.value = true;
    try {
      const { data, error } = await api.resumes.post(resumeData);
      if (error) throw new Error("Failed to create resume");
      await fetchResumes();
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function updateResume(id: string, updates: UpdateResumeInput) {
    loading.value = true;
    try {
      const { data, error } = await api.resumes({ id }).put(updates);
      if (error) throw new Error("Failed to update resume");
      const normalized = toResumeData(data);
      if (!normalized) throw new Error("Invalid resume payload");
      currentResume.value = normalized;
      await fetchResumes();
      return normalized;
    } finally {
      loading.value = false;
    }
  }

  async function deleteResume(id: string) {
    loading.value = true;
    try {
      const { error } = await api.resumes({ id }).delete();
      if (error) throw new Error("Failed to delete resume");
      if (currentResume.value?.id === id) {
        currentResume.value = null;
      }
      await fetchResumes();
    } finally {
      loading.value = false;
    }
  }

  async function exportResume(id: string, template?: ResumeTemplate) {
    loading.value = true;
    try {
      const body: ExportResumeInput = template ? { template } : {};
      const { data, error } = await api.resumes({ id }).export.post(body);
      if (error) throw new Error("Failed to export resume");
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function exportResumeOnePage(id: string, template?: ResumeTemplate) {
    loading.value = true;
    try {
      const body: ExportResumeInput = template ? { template } : {};
      const { data, error } = await api.resumes({ id }).export.post(body);
      if (error) throw new Error("Failed to export one-page resume");
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function aiEnhance(id: string) {
    loading.value = true;
    try {
      const { data, error } = await api.resumes({ id })["ai-enhance"].post({});
      if (error) throw new Error("Failed to enhance resume");
      const normalized = toResumeData(data);
      if (!normalized) throw new Error("Invalid resume payload");
      currentResume.value = normalized;
      await fetchResumes();
      return normalized;
    } finally {
      loading.value = false;
    }
  }

  async function aiScore(id: string, jobId: string) {
    loading.value = true;
    try {
      const payload: ScoreResumeInput = { jobId };
      const { data, error } = await api.resumes({ id })["ai-score"].post(payload);
      if (error) throw new Error("Failed to score resume");
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function generateCvQuestions(config: {
    targetRole: string;
    studioName?: string;
    experienceLevel?: string;
  }) {
    const key = getStoredApiKey();
    const res = await $fetch<{
      questions?: Array<{ id: string; question: string; category: string }>;
      error?: string;
    }>("/api/resumes/from-questions/generate", {
      method: "POST",
      body: config,
      headers: key ? { Authorization: `Bearer ${key}` } : {},
    });
    if ("error" in res && res.error) throw new Error(res.error);
    return res.questions ?? [];
  }

  async function synthesizeCvResume(
    questionsAndAnswers: Array<{ id: string; question: string; answer: string; category: string }>,
  ) {
    const key = getStoredApiKey();
    const res = await $fetch<ResumeSynthesisSuccess | ResumeSynthesisError>(
      "/api/resumes/from-questions/synthesize",
      {
        method: "POST",
        body: { questionsAndAnswers },
        headers: key ? { Authorization: `Bearer ${key}` } : {},
      },
    );
    if (isResumeSynthesisError(res) && res.error)
      throw new Error(String(res.details ?? res.error ?? "Unknown error"));
    return res;
  }

  return {
    resumes: readonly(resumes),
    currentResume: readonly(currentResume),
    loading: readonly(loading),
    fetchResumes,
    getResume,
    createResume,
    updateResume,
    deleteResume,
    exportResume,
    exportResumeOnePage,
    aiEnhance,
    aiScore,
    generateCvQuestions,
    synthesizeCvResume,
  };
}
