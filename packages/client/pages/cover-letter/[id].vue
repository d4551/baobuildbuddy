<script setup lang="ts">
const CONTENT_SECTION_SPLIT = /\n{2,}/u;

import {
  COVER_LETTER_DEFAULT_TEMPLATE,
  type CoverLetterTemplate,
  isCoverLetterTemplate,
} from "@bao/shared/constants/cover-letter";
import { APP_ROUTES } from "@bao/shared/constants/routes";
import type { CoverLetterData } from "@bao/shared/types/cover-letter";
import { useI18n } from "vue-i18n";
import { runExportWithToast } from "~/composables/export-with-toast";
import {
  ICON_SIZE_CLASS,
  OUTLINE_ACTION_CLASS,
  PAGE_HEADER_DESCRIPTION_MEASURE_CLASS,
  PRIMARY_ACTION_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
} from "~/constants/layout";
import {
  coverLetterContentToPlainText,
  plainTextToCoverLetterContent,
} from "~/utils/cover-letter-content";

definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const { getCoverLetter, updateCoverLetter, generateCoverLetter, exportDocument, loading } =
  useCoverLetter();
type GenerateCoverLetterResult = Awaited<ReturnType<typeof generateCoverLetter>>;
const { $toast } = useNuxtApp();
const { t } = useI18n();
useSeoMeta({
  title: t("coverLetterDetailPage.details.title"),
  description: t("coverLetterPage.subtitle"),
});

const letter = ref<CoverLetterData | null>(null);
const letterId = computed(() => {
  return typeof route.params.id === "string" ? route.params.id : "";
});
const regenerating = ref(false);
const showRegenerateDialog = ref(false);

const formData = reactive<{
  company: string;
  position: string;
  template: CoverLetterTemplate;
  contentText: string;
}>({
  company: "",
  position: "",
  template: COVER_LETTER_DEFAULT_TEMPLATE,
  contentText: "",
});

const lastSavedFingerprint = ref("");

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

const hasUnsavedChanges = computed(() => buildFormFingerprint() !== lastSavedFingerprint.value);

const { notifyEdited: scheduleCoverLetterAutosave } = useEditorChrome({
  getFingerprint: () => buildFormFingerprint(),
  onAutosave: () => handleSave(),
});

function templateLabel(template: CoverLetterTemplate): string {
  return t(`coverLetterDetailPage.templates.${template}`);
}

function resolveTemplate(value: string | undefined): CoverLetterTemplate {
  return isCoverLetterTemplate(value) ? value : COVER_LETTER_DEFAULT_TEMPLATE;
}

function buildFormFingerprint(): string {
  return JSON.stringify({
    company: formData.company.trim(),
    position: formData.position.trim(),
    template: formData.template,
    contentText: formData.contentText.trim(),
  });
}

function applyCoverLetterToForm(value: CoverLetterData): void {
  letter.value = value;
  formData.company = value.company;
  formData.position = value.position;
  formData.template = resolveTemplate(value.template);
  formData.contentText = coverLetterContentToPlainText(value.content);
  lastSavedFingerprint.value = buildFormFingerprint();
}

async function loadCoverLetter() {
  if (!letterId.value) return;

  const loaded = await getCoverLetter(letterId.value);
  if (loaded) {
    applyCoverLetterToForm(loaded);
  }
}

onMounted(async () => {
  await loadCoverLetter();
});

function resolveGeneratedContent(
  value: Exclude<GenerateCoverLetterResult, null>,
): CoverLetterData["content"] {
  return "content" in value ? value.content : value.coverLetter.content;
}

function requestRegenerate() {
  showRegenerateDialog.value = true;
}

async function handleSave() {
  if (!letterId.value) return;

  if (formData.company.trim().length < COVER_LETTER_COMPANY_MIN_LENGTH) {
    $toast.error(
      t("coverLetterDetailPage.toasts.companyMinLength", {
        count: COVER_LETTER_COMPANY_MIN_LENGTH,
      }),
    );
    return;
  }

  if (formData.position.trim().length < COVER_LETTER_POSITION_MIN_LENGTH) {
    $toast.error(
      t("coverLetterDetailPage.toasts.positionMinLength", {
        count: COVER_LETTER_POSITION_MIN_LENGTH,
      }),
    );
    return;
  }

  const updated = await updateCoverLetter(letterId.value, {
    company: formData.company.trim(),
    position: formData.position.trim(),
    template: formData.template,
    content: plainTextToCoverLetterContent(formData.contentText),
  });

  if (updated === null) return;

  const normalized = await getCoverLetter(letterId.value);
  if (normalized) {
    applyCoverLetterToForm(normalized);
  }

  lastSavedFingerprint.value = buildFormFingerprint();
  $toast.success(t("coverLetterDetailPage.toasts.saved"));
}

async function handleRegenerate() {
  regenerating.value = true;
  const regenerated = await generateCoverLetter({
    company: formData.company.trim(),
    position: formData.position.trim(),
    template: formData.template,
    save: false,
  });
  regenerating.value = false;

  if (regenerated === null) {
    showRegenerateDialog.value = false;
    return;
  }

  const regeneratedContent = resolveGeneratedContent(regenerated);
  if (!regeneratedContent) {
    $toast.error(t("coverLetterDetailPage.toasts.regenerateMissingContent"));
    showRegenerateDialog.value = false;
    return;
  }

  formData.contentText = coverLetterContentToPlainText(regeneratedContent);
  $toast.success(t("coverLetterDetailPage.toasts.regenerated"));
  showRegenerateDialog.value = false;
}

function clearContent() {
  formData.contentText = "";
}

async function handleExport(format: "pdf" | "docx") {
  const id = letterId.value;
  if (!id) {
    return;
  }
  // Export reads DB row — persist dirty template/content first or PDF/DOCX lies.
  if (buildFormFingerprint() !== lastSavedFingerprint.value) {
    await handleSave();
    if (buildFormFingerprint() !== lastSavedFingerprint.value) {
      return;
    }
  }
  await runExportWithToast({
    exportFn: () => exportDocument(id, format, formData.template),
    failMessage: t("coverLetterDetailPage.toasts.exportFailed"),
    successMessage: t("coverLetterDetailPage.toasts.exported"),
    toast: $toast,
    t,
  });
}
</script>

<template>
  <PageScaffold width-token="wide" spacing-token="comfortable" labelled-by="cover-letter-detail-title">
    <PageHeroHeader
      title-id="cover-letter-detail-title"
      :title="heroTitle"
      :description="heroDescription"
      :description-class="PAGE_HEADER_DESCRIPTION_MEASURE_CLASS"
    >
      <template #breadcrumbs>
        <AppBreadcrumbs :crumbs="breadcrumbs" />
      </template>
      <template #actions>
        <button type="button"
          :class="[OUTLINE_ACTION_CLASS]"
          :disabled="regenerating"
          :aria-label="t('coverLetterDetailPage.actions.regenerateAria')"
          @click="requestRegenerate"
        >
          <LoadingSpinner size="xs" label="Loading" v-if="regenerating" />
          <IconRefresh v-else :class="ICON_SIZE_CLASS['4']" />
          {{ t("coverLetterDetailPage.actions.regenerateButton") }}
        </button>

        <AppExportMenu
          :button-label="t('coverLetterDetailPage.actions.exportButton')"
          :button-aria-label="t('coverLetterDetailPage.actions.exportAria')"
          :disabled="loading"
          :summary-class="OUTLINE_ACTION_CLASS"
          @export="handleExport"
        />

        <button type="button"
          :class="[PRIMARY_ACTION_CLASS]"
          :disabled="!hasUnsavedChanges"
          :aria-label="t('coverLetterDetailPage.actions.saveAria')"
          @click="handleSave"
        >
          {{ t("coverLetterDetailPage.actions.saveButton") }}
        </button>
      </template>
    </PageHeroHeader>

    <LoadingSkeleton v-if="loading" :lines="10" />

    <div v-else :class="[STACK_SPACE_Y_TOKEN_CLASS.stack6]">
      <CoverLetterDetailStats
        :content-character-count="contentCharacterCount"
        :content-section-count="contentSectionCount"
        :has-unsaved-changes="hasUnsavedChanges"
        :t="t"
      />

      <CoverLetterDetailFormCard v-model:form-data="formData" :template-label="templateLabel" :t="t" />

      <CoverLetterEditorCard
        v-model:content-text="formData.contentText"
        :content-character-count="contentCharacterCount"
        :is-dirty="hasUnsavedChanges"
        :t="t"
        @clear="clearContent"
        @save="handleSave"
        @edited="scheduleCoverLetterAutosave"
      />
    </div>

    <ConfirmDialog
      id="cover-letter-regenerate-dialog"
      v-model:open="showRegenerateDialog"
      :title="t('coverLetterDetailPage.regenerateDialog.title')"
      :message="t('coverLetterDetailPage.regenerateDialog.message')"
      :confirm-text="t('coverLetterDetailPage.regenerateDialog.confirmButton')"
      :cancel-text="t('coverLetterDetailPage.regenerateDialog.cancelButton')"
      @confirm="handleRegenerate"
      @cancel="showRegenerateDialog = false"
    />
  </PageScaffold>
</template>
