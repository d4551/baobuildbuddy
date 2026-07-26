import {
  COVER_LETTER_COMPANY_MIN_LENGTH,
  COVER_LETTER_POSITION_MIN_LENGTH,
} from "@bao/shared/constants/cover-letter";
import type { CoverLetterData } from "@bao/shared/types/cover-letter";
import type { useI18n } from "vue-i18n";
import { runExportWithToast } from "~/composables/export-with-toast";
import type { CoverLetterDetailFormState } from "~/composables/cover-letter-detail-page-state";
import {
  coverLetterContentToPlainText,
  plainTextToCoverLetterContent,
} from "~/utils/cover-letter-content";

type CoverLetterApi = ReturnType<typeof useCoverLetter>;
type GenerateCoverLetterResult = Awaited<ReturnType<CoverLetterApi["generateCoverLetter"]>>;
type Toast = ReturnType<typeof useNuxtApp>["$toast"];
type Translate = ReturnType<typeof useI18n>["t"];

export type CoverLetterDetailActionDeps = {
  readonly state: CoverLetterDetailFormState;
  readonly api: CoverLetterApi;
  readonly toast: Toast;
  readonly t: Translate;
};

const resolveGeneratedContent = (
  value: Exclude<GenerateCoverLetterResult, null>,
): CoverLetterData["content"] =>
  "content" in value ? value.content : value.coverLetter.content;

const validateRequiredFields = (deps: CoverLetterDetailActionDeps): boolean => {
  const { state, toast, t } = deps;
  if (state.formData.company.trim().length < COVER_LETTER_COMPANY_MIN_LENGTH) {
    toast.error(
      t("coverLetterDetailPage.toasts.companyMinLength", {
        count: COVER_LETTER_COMPANY_MIN_LENGTH,
      }),
    );
    return false;
  }
  if (state.formData.position.trim().length < COVER_LETTER_POSITION_MIN_LENGTH) {
    toast.error(
      t("coverLetterDetailPage.toasts.positionMinLength", {
        count: COVER_LETTER_POSITION_MIN_LENGTH,
      }),
    );
    return false;
  }
  return true;
};

/** Loads the persisted letter into the form model (id from the route). */
export const loadCoverLetter = async (deps: CoverLetterDetailActionDeps): Promise<void> => {
  const { state, api } = deps;
  if (!state.letterId.value) return;

  const loaded = await api.getCoverLetter(state.letterId.value);
  if (loaded) {
    state.applyCoverLetterToForm(loaded);
  }
};

/** Validates, persists, and re-normalizes the letter; toasts the outcome. */
export const saveCoverLetter = async (deps: CoverLetterDetailActionDeps): Promise<void> => {
  const { state, api, toast, t } = deps;
  if (!state.letterId.value) return;
  if (!validateRequiredFields(deps)) return;

  const updated = await api.updateCoverLetter(state.letterId.value, {
    company: state.formData.company.trim(),
    position: state.formData.position.trim(),
    template: state.formData.template,
    content: plainTextToCoverLetterContent(state.formData.contentText),
  });

  if (updated === null) return;

  const normalized = await api.getCoverLetter(state.letterId.value);
  if (normalized) {
    state.applyCoverLetterToForm(normalized);
  }

  state.lastSavedFingerprint.value = state.buildFormFingerprint();
  toast.success(t("coverLetterDetailPage.toasts.saved"));
};

/** Runs AI regeneration and applies the result to the editor buffer. */
export const regenerateCoverLetter = async (
  deps: CoverLetterDetailActionDeps,
): Promise<void> => {
  const { state, api, toast, t } = deps;
  state.regenerating.value = true;
  const regenerated = await api.generateCoverLetter({
    company: state.formData.company.trim(),
    position: state.formData.position.trim(),
    template: state.formData.template,
    save: false,
  });
  state.regenerating.value = false;

  if (regenerated === null) {
    state.showRegenerateDialog.value = false;
    return;
  }

  const regeneratedContent = resolveGeneratedContent(regenerated);
  if (!regeneratedContent) {
    toast.error(t("coverLetterDetailPage.toasts.regenerateMissingContent"));
    state.showRegenerateDialog.value = false;
    return;
  }

  state.formData.contentText = coverLetterContentToPlainText(regeneratedContent);
  toast.success(t("coverLetterDetailPage.toasts.regenerated"));
  state.showRegenerateDialog.value = false;
};

/** Exports the persisted letter, saving dirty edits first so the file matches. */
export const exportCoverLetter = async (
  deps: CoverLetterDetailActionDeps,
  format: "pdf" | "docx",
): Promise<void> => {
  const { state, api, toast, t } = deps;
  const id = state.letterId.value;
  if (!id) {
    return;
  }
  // Export reads DB row — persist dirty template/content first or PDF/DOCX lies.
  if (state.buildFormFingerprint() !== state.lastSavedFingerprint.value) {
    await saveCoverLetter(deps);
    if (state.buildFormFingerprint() !== state.lastSavedFingerprint.value) {
      return;
    }
  }
  await runExportWithToast({
    exportFn: () => api.exportDocument(id, format, state.formData.template),
    failMessage: t("coverLetterDetailPage.toasts.exportFailed"),
    successMessage: t("coverLetterDetailPage.toasts.exported"),
    toast,
    t,
  });
};
