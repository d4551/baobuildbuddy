import type { ResumeData, ResumeTemplate } from "@bao/shared";
import { STATE_KEYS } from "@bao/shared";
import { getStoredApiKey } from "~/plugins/eden";
import { toResumeData } from "./api-normalizers";
import { assertApiResponse, requireValue, withLoadingState } from "./async-flow";

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
    return withLoadingState(loading, async () => {
      const { data, error } = await api.resumes.get();
      assertApiResponse(error, "Failed to fetch resumes");
      resumes.value = Array.isArray(data)
        ? data
            .map((entry) => toResumeData(entry))
            .filter((entry): entry is ResumeData => entry !== null)
        : [];
    });
  }

  async function getResume(id: string) {
    return withLoadingState(loading, async () => {
      const { data, error } = await api.resumes({ id }).get();
      assertApiResponse(error, "Failed to fetch resume");
      const normalized = requireValue(toResumeData(data), "Invalid resume payload");
      currentResume.value = normalized;
      return normalized;
    });
  }

  async function createResume(resumeData: CreateResumeInput) {
    return withLoadingState(loading, async () => {
      const { data, error } = await api.resumes.post(resumeData);
      assertApiResponse(error, "Failed to create resume");
      await fetchResumes();
      return data;
    });
  }

  async function updateResume(id: string, updates: UpdateResumeInput) {
    return withLoadingState(loading, async () => {
      const { data, error } = await api.resumes({ id }).put(updates);
      assertApiResponse(error, "Failed to update resume");
      const normalized = requireValue(toResumeData(data), "Invalid resume payload");
      currentResume.value = normalized;
      await fetchResumes();
      return normalized;
    });
  }

  async function deleteResume(id: string) {
    return withLoadingState(loading, async () => {
      const { error } = await api.resumes({ id }).delete();
      assertApiResponse(error, "Failed to delete resume");
      if (currentResume.value?.id === id) {
        currentResume.value = null;
      }
      await fetchResumes();
    });
  }

  async function exportResume(id: string, template?: ResumeTemplate) {
    return withLoadingState(loading, async () => {
      const body: ExportResumeInput = template ? { template } : {};
      const { data, error } = await api.resumes({ id }).export.post(body);
      assertApiResponse(error, "Failed to export resume");
      return data;
    });
  }

  async function exportResumeOnePage(id: string, template?: ResumeTemplate) {
    return withLoadingState(loading, async () => {
      const body: ExportResumeInput = template ? { template } : {};
      const { data, error } = await api.resumes({ id }).export.post(body);
      assertApiResponse(error, "Failed to export one-page resume");
      return data;
    });
  }

  async function aiEnhance(id: string) {
    return withLoadingState(loading, async () => {
      const { data, error } = await api.resumes({ id })["ai-enhance"].post({});
      assertApiResponse(error, "Failed to enhance resume");
      const normalized = requireValue(toResumeData(data), "Invalid resume payload");
      currentResume.value = normalized;
      await fetchResumes();
      return normalized;
    });
  }

  async function aiScore(id: string, jobId: string) {
    return withLoadingState(loading, async () => {
      const payload: ScoreResumeInput = { jobId };
      const { data, error } = await api.resumes({ id })["ai-score"].post(payload);
      assertApiResponse(error, "Failed to score resume");
      return data;
    });
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
