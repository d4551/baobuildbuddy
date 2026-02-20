import type { CoverLetterData } from "@bao/shared";
import { STATE_KEYS } from "@bao/shared";
import { toCoverLetterData } from "./api-normalizers";

interface CreateCoverLetterInput {
  company: string;
  position: string;
  jobInfo?: Record<string, unknown>;
  content?: CoverLetterData["content"];
  template?: CoverLetterData["template"];
}

type UpdateCoverLetterInput = Partial<CreateCoverLetterInput>;

interface GenerateCoverLetterInput {
  company: string;
  position: string;
  resumeId?: string;
  template?: CoverLetterData["template"];
  save?: boolean;
  jobInfo?: Record<string, unknown>;
}

/**
 * Cover letter management composable.
 */
export function useCoverLetter() {
  const api = useApi();
  const coverLetters = useState<CoverLetterData[]>(STATE_KEYS.COVERLETTERS_LIST, () => []);
  const currentLetter = useState<CoverLetterData | null>(
    STATE_KEYS.COVERLETTER_CURRENT,
    () => null,
  );
  const loading = useState(STATE_KEYS.COVERLETTER_LOADING, () => false);

  async function fetchCoverLetters() {
    loading.value = true;
    try {
      const { data, error } = await api["cover-letters"].get();
      if (error) throw new Error("Failed to fetch cover letters");
      const rows = Array.isArray(data) ? data : [];
      coverLetters.value = rows
        .map((row) => toCoverLetterData(row))
        .filter((row): row is CoverLetterData => row !== null);
    } finally {
      loading.value = false;
    }
  }

  async function getCoverLetter(id: string) {
    loading.value = true;
    try {
      const { data, error } = await api["cover-letters"]({ id }).get();
      if (error || !data) throw new Error("Failed to fetch cover letter");
      const normalized = toCoverLetterData(data);
      if (!normalized) {
        throw new Error("Invalid cover letter payload");
      }
      currentLetter.value = normalized;
      return normalized;
    } finally {
      loading.value = false;
    }
  }

  async function createCoverLetter(letterData: CreateCoverLetterInput) {
    loading.value = true;
    try {
      const { data, error } = await api["cover-letters"].post(letterData);
      if (error) throw new Error("Failed to create cover letter");
      await fetchCoverLetters();
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function updateCoverLetter(id: string, updates: UpdateCoverLetterInput) {
    loading.value = true;
    try {
      const { data, error } = await api["cover-letters"]({ id }).put(updates);
      if (error || !data) throw new Error("Failed to update cover letter");
      const normalized = toCoverLetterData(data);
      if (normalized) {
        currentLetter.value = normalized;
      }
      await fetchCoverLetters();
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function deleteCoverLetter(id: string) {
    loading.value = true;
    try {
      const { error } = await api["cover-letters"]({ id }).delete();
      if (error) throw new Error("Failed to delete cover letter");
      if (currentLetter.value?.id === id) {
        currentLetter.value = null;
      }
      await fetchCoverLetters();
    } finally {
      loading.value = false;
    }
  }

  async function generateCoverLetter(generationData: GenerateCoverLetterInput) {
    loading.value = true;
    try {
      const { data, error } = await api["cover-letters"].generate.post(generationData);
      if (error) throw new Error("Failed to generate cover letter");
      if (generationData.save) {
        await fetchCoverLetters();
      }
      return data;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Export a cover letter as PDF.
   */
  async function exportPdf(id: string) {
    loading.value = true;
    try {
      const { data, error } = await api["cover-letters"]({ id }).export.post();
      if (error) throw new Error("Failed to export cover letter as PDF");
      return data;
    } finally {
      loading.value = false;
    }
  }

  return {
    coverLetters: readonly(coverLetters),
    currentLetter: readonly(currentLetter),
    loading: readonly(loading),
    fetchCoverLetters,
    getCoverLetter,
    createCoverLetter,
    updateCoverLetter,
    deleteCoverLetter,
    generateCoverLetter,
    exportPdf,
  };
}
