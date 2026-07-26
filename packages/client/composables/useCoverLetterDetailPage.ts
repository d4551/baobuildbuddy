import {
  type CoverLetterDetailActionDeps,
  exportCoverLetter,
  loadCoverLetter,
  regenerateCoverLetter,
  saveCoverLetter,
} from "~/composables/cover-letter-detail-page-actions";
import {
  useCoverLetterDetailDerived,
  useCoverLetterDetailFormState,
} from "~/composables/cover-letter-detail-page-state";

/**
 * Composition root for the cover-letter detail page (pages/cover-letter/[id].vue).
 * Form state lives in cover-letter-detail-page-state; effects in
 * cover-letter-detail-page-actions. Autosave wiring happens here.
 */
export const useCoverLetterDetailPage = () => {
  const { $toast } = useNuxtApp();
  const api = useCoverLetter();
  const formState = useCoverLetterDetailFormState();
  const derived = useCoverLetterDetailDerived(formState);
  const deps: CoverLetterDetailActionDeps = {
    state: formState,
    api,
    toast: $toast,
    t: derived.t,
  };

  const handleSave = () => saveCoverLetter(deps);

  const { notifyEdited: scheduleCoverLetterAutosave } = useEditorChrome({
    getFingerprint: () => formState.buildFormFingerprint(),
    onAutosave: handleSave,
  });

  onMounted(async () => {
    await loadCoverLetter(deps);
  });

  return {
    t: derived.t,
    loading: api.loading,
    formData: formState.formData,
    regenerating: formState.regenerating,
    showRegenerateDialog: formState.showRegenerateDialog,
    breadcrumbs: derived.breadcrumbs,
    heroTitle: derived.heroTitle,
    heroDescription: derived.heroDescription,
    contentCharacterCount: derived.contentCharacterCount,
    contentSectionCount: derived.contentSectionCount,
    hasUnsavedChanges: formState.hasUnsavedChanges,
    templateLabel: derived.templateLabel,
    scheduleCoverLetterAutosave,
    handleSave,
    handleRegenerate: () => regenerateCoverLetter(deps),
    requestRegenerate: () => {
      formState.showRegenerateDialog.value = true;
    },
    clearContent: () => {
      formState.formData.contentText = "";
    },
    handleExport: (format: "pdf" | "docx") => exportCoverLetter(deps, format),
  };
};
