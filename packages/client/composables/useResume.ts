import type { ResumeData } from "@bao/shared";
import { STATE_KEYS } from "@bao/shared";
import { getStoredApiKey } from "~/plugins/eden";

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
      resumes.value = data as ResumeData[];
    } finally {
      loading.value = false;
    }
  }

  async function getResume(id: string) {
    loading.value = true;
    try {
      const { data, error } = await api.resumes[id].get();
      if (error) throw new Error("Failed to fetch resume");
      currentResume.value = data;
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function createResume(resumeData: Partial<ResumeData>) {
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

  async function updateResume(id: string, updates: Partial<ResumeData>) {
    loading.value = true;
    try {
      const { data, error } = await api.resumes[id].put(updates);
      if (error) throw new Error("Failed to update resume");
      currentResume.value = data;
      await fetchResumes();
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function deleteResume(id: string) {
    loading.value = true;
    try {
      const { error } = await api.resumes[id].delete();
      if (error) throw new Error("Failed to delete resume");
      if (currentResume.value?.id === id) {
        currentResume.value = null;
      }
      await fetchResumes();
    } finally {
      loading.value = false;
    }
  }

  async function exportResume(id: string, template?: "modern" | "google-xyz" | "gaming") {
    loading.value = true;
    try {
      const body = template ? { template } : {};
      const { data, error } = await api.resumes[id].export.post(body);
      if (error) throw new Error("Failed to export resume");
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function exportResumeOnePage(id: string, template?: "modern" | "google-xyz" | "gaming") {
    loading.value = true;
    try {
      const body = { template, onePage: true };
      const { data, error } = await api.resumes[id].export.post(body);
      if (error) throw new Error("Failed to export one-page resume");
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function aiEnhance(id: string) {
    loading.value = true;
    try {
      const { data, error } = await api.resumes[id]["ai-enhance"].post();
      if (error) throw new Error("Failed to enhance resume");
      currentResume.value = data;
      await fetchResumes();
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function aiScore(id: string, jobId: string) {
    loading.value = true;
    try {
      const { data, error } = await api.resumes[id]["ai-score"].post({ jobId });
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
