import {
  COVER_LETTER_DEFAULT_TEMPLATE,
  type CoverLetterTemplate,
  isCoverLetterTemplate,
} from "@bao/shared/constants/cover-letter";
import { APP_ROUTES } from "@bao/shared/constants/routes";
import type { CoverLetterData } from "@bao/shared/types/cover-letter";
import { useI18n } from "vue-i18n";
import { coverLetterContentToPlainText } from "~/utils/cover-letter-content";

const CONTENT_SECTION_SPLIT = /\n{2,}/u;

export type CoverLetterDetailFormData = {
  company: string;
  position: string;
  template: CoverLetterTemplate;
  contentText: string;
};

/**
 * Core form model for the cover-letter detail page: refs, the persistence
 * fingerprint contract, and mutation helpers.
 */
export const useCoverLetterDetailFormState = () => {
  const route = useRoute();

  const letter = ref<CoverLetterData | null>(null);
  const letterId = computed(() =>
    typeof route.params.id === "string" ? route.params.id : "",
  );
  const regenerating = ref(false);
  const showRegenerateDialog = ref(false);

  const formData = reactive<CoverLetterDetailFormData>({
    company: "",
    position: "",
    template: COVER_LETTER_DEFAULT_TEMPLATE,
    contentText: "",
  });

  const lastSavedFingerprint = ref("");

  function buildFormFingerprint(): string {
    return JSON.stringify({
      company: formData.company.trim(),
      position: formData.position.trim(),
      template: formData.template,
      contentText: formData.contentText.trim(),
    });
  }

  const hasUnsavedChanges = computed(
    () => buildFormFingerprint() !== lastSavedFingerprint.value,
  );

  function applyCoverLetterToForm(value: CoverLetterData): void {
    letter.value = value;
    formData.company = value.company;
    formData.position = value.position;
    formData.template = isCoverLetterTemplate(value.template)
      ? value.template
      : COVER_LETTER_DEFAULT_TEMPLATE;
    formData.contentText = coverLetterContentToPlainText(value.content);
    lastSavedFingerprint.value = buildFormFingerprint();
  }

  return {
    letter,
    letterId,
    regenerating,
    showRegenerateDialog,
    formData,
    lastSavedFingerprint,
    buildFormFingerprint,
    hasUnsavedChanges,
    applyCoverLetterToForm,
  };
};

export type CoverLetterDetailFormState = ReturnType<typeof useCoverLetterDetailFormState>;

/**
 * Derived presentation values for the cover-letter detail page header and stats.
 */
export const useCoverLetterDetailDerived = (formState: CoverLetterDetailFormState) => {
  const { t } = useI18n();
  const { letter, formData } = formState;

  const breadcrumbs = computed(() => [
    { label: t("nav.dashboard"), to: APP_ROUTES.dashboard },
    { label: t("nav.coverLetter"), to: APP_ROUTES.coverLetter },
    { label: letter.value?.position || t("coverLetterDetailPage.breadcrumbFallback") },
  ]);
  const heroTitle = computed(() =>
    t("coverLetterDetailPage.hero.title", {
      position: formData.position.trim() || t("coverLetterDetailPage.breadcrumbFallback"),
      company: formData.company.trim() || t("coverLetterDetailPage.details.companyPlaceholder"),
    }),
  );
  const heroDescription = computed(() => t("coverLetterDetailPage.hero.description"));

  const contentCharacterCount = computed(() => formData.contentText.trim().length);
  const contentSectionCount = computed(() => {
    if (!formData.contentText.trim()) return 0;
    return formData.contentText
      .trim()
      .split(CONTENT_SECTION_SPLIT)
      .map((section) => section.trim())
      .filter((section) => section.length > 0).length;
  });

  function templateLabel(template: CoverLetterTemplate): string {
    return t(`coverLetterDetailPage.templates.${template}`);
  }

  return {
    t,
    breadcrumbs,
    heroTitle,
    heroDescription,
    contentCharacterCount,
    contentSectionCount,
    templateLabel,
  };
};
