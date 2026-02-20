import type { CoverLetterData } from "@bao/shared";
import { STATE_KEYS } from "@bao/shared";

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
      coverLetters.value = data as CoverLetterData[];
    } finally {
      loading.value = false;
    }
  }

  async function getCoverLetter(id: string) {
    loading.value = true;
    try {
      const { data, error } = await api["cover-letters"][id].get();
      if (error) throw new Error("Failed to fetch cover letter");
      currentLetter.value = data;
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function createCoverLetter(letterData: Partial<CoverLetterData>) {
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

  async function updateCoverLetter(id: string, updates: Partial<CoverLetterData>) {
    loading.value = true;
    try {
      const { data, error } = await api["cover-letters"][id].put(updates);
      if (error) throw new Error("Failed to update cover letter");
      currentLetter.value = data;
      await fetchCoverLetters();
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function deleteCoverLetter(id: string) {
    loading.value = true;
    try {
      const { error } = await api["cover-letters"][id].delete();
      if (error) throw new Error("Failed to delete cover letter");
      if (currentLetter.value?.id === id) {
        currentLetter.value = null;
      }
      await fetchCoverLetters();
    } finally {
      loading.value = false;
    }
  }

  async function generateCoverLetter(generationData: Record<string, unknown>) {
    loading.value = true;
    try {
      const { data, error } = await api["cover-letters"].generate.post(generationData);
      if (error) throw new Error("Failed to generate cover letter");
      await fetchCoverLetters();
      return data;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Export a cover letter as PDF
   */
  async function exportPdf(id: string) {
    loading.value = true;
    try {
      const { data, error } = await api["cover-letters"][id].export.post();
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
