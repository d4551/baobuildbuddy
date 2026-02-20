import type { CoverLetterData } from "@bao/shared";
import { STATE_KEYS } from "@bao/shared";
import { useI18n } from "vue-i18n";
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
  const { $toast } = useNuxtApp();
  const { t } = useI18n();
  const coverLetters = useState<CoverLetterData[]>(STATE_KEYS.COVERLETTERS_LIST, () => []);
  const currentLetter = useState<CoverLetterData | null>(
    STATE_KEYS.COVERLETTER_CURRENT,
    () => null,
  );
  const loading = useState(STATE_KEYS.COVERLETTER_LOADING, () => false);

  async function fetchCoverLetters() {
    loading.value = true;
    const { data, error } = await api["cover-letters"].get();
    loading.value = false;
    if (error) {
      $toast.error(t("coverLetterPage.toasts.fetchFailed"));
      return;
    }
    const rows = Array.isArray(data) ? data : [];
    coverLetters.value = rows
      .map((row) => toCoverLetterData(row))
      .filter((row): row is CoverLetterData => row !== null);
  }

  async function getCoverLetter(id: string) {
    loading.value = true;
    const { data, error } = await api["cover-letters"]({ id }).get();
    loading.value = false;
    if (error || !data) {
      $toast.error(t("coverLetterDetailPage.toasts.loadFailed"));
      return null;
    }
    const normalized = toCoverLetterData(data);
    if (!normalized) {
      $toast.error(t("coverLetterDetailPage.toasts.loadFailed"));
      return null;
    }
    currentLetter.value = normalized;
    return normalized;
  }

  async function createCoverLetter(letterData: CreateCoverLetterInput) {
    loading.value = true;
    const { data, error } = await api["cover-letters"].post(letterData);
    loading.value = false;
    if (error) {
      $toast.error(t("coverLetterPage.toasts.generateFailed"));
      return null;
    }
    await fetchCoverLetters();
    return data;
  }

  async function updateCoverLetter(id: string, updates: UpdateCoverLetterInput) {
    loading.value = true;
    const { data, error } = await api["cover-letters"]({ id }).put(updates);
    loading.value = false;
    if (error || !data) {
      $toast.error(t("coverLetterDetailPage.toasts.saveFailed"));
      return null;
    }
    const normalized = toCoverLetterData(data);
    if (normalized) {
      currentLetter.value = normalized;
    }
    await fetchCoverLetters();
    return data;
  }

  async function deleteCoverLetter(id: string) {
    loading.value = true;
    const { error } = await api["cover-letters"]({ id }).delete();
    loading.value = false;
    if (error) {
      $toast.error(t("coverLetterPage.toasts.deleteFailed"));
      return;
    }
    if (currentLetter.value?.id === id) {
      currentLetter.value = null;
    }
    await fetchCoverLetters();
  }

  async function generateCoverLetter(generationData: GenerateCoverLetterInput) {
    loading.value = true;
    const { data, error } = await api["cover-letters"].generate.post(generationData);
    loading.value = false;
    if (error) {
      $toast.error(t("coverLetterPage.toasts.generateFailed"));
      return null;
    }
    if (generationData.save) {
      await fetchCoverLetters();
    }
    return data;
  }

  /**
   * Export a cover letter as PDF.
   */
  async function exportPdf(id: string) {
    loading.value = true;
    const { data, error } = await api["cover-letters"]({ id }).export.post();
    loading.value = false;
    if (error) {
      $toast.error(t("coverLetterDetailPage.toasts.exportFailed"));
      return null;
    }
    return data;
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
