<script setup lang="ts">
import {
  COVER_LETTER_DEFAULT_TEMPLATE,
  isCoverLetterTemplate,
  type CoverLetterTemplate,
} from "@bao/shared/constants/cover-letter";
import { APP_ROUTES } from "@bao/shared/constants/routes";
import type { CoverLetterData } from "@bao/shared/types/cover-letter";
import { useI18n } from "vue-i18n";
import { settlePromise } from "~/composables/async-flow";
import { PAGE_HEADER_DESCRIPTION_MEASURE_CLASS, STACK_SPACE_Y_TOKEN_CLASS } from "~/constants/layout";
import {
  coverLetterContentToPlainText,
  plainTextToCoverLetterContent,
} from "~/utils/cover-letter-content";
import { getErrorMessage } from "~/utils/errors";

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
    .split(/\n{2,}/)
    .map((section) => section.trim())
    .filter((section) => section.length > 0).length;
});

const hasUnsavedChanges = computed(() => buildFormFingerprint() !== lastSavedFingerprint.value);

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
  if (!letterId.value) {
    return;
  }

  const exportResult = await settlePromise(
    exportDocument(letterId.value, format),
    t("coverLetterDetailPage.toasts.exportFailed"),
  );
  if (!exportResult.ok) {
    $toast.error(
      getErrorMessage(exportResult.error, t("coverLetterDetailPage.toasts.exportFailed")),
    );
    return;
  }

  $toast.success(t("coverLetterDetailPage.toasts.exported"));
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
        <button
          class="btn btn-outline"
          :disabled="regenerating"
          :aria-label="t('coverLetterDetailPage.actions.regenerateAria')"
          @click="requestRegenerate"
        >
          <LoadingSpinner size="xs" label="Loading" v-if="regenerating" />
          <IconRefresh v-else class="h-4 w-4" />
          {{ t("coverLetterDetailPage.actions.regenerateButton") }}
        </button>

        <AppExportMenu
          :button-label="t('coverLetterDetailPage.actions.exportButton')"
          :button-aria-label="t('coverLetterDetailPage.actions.exportAria')"
          :disabled="loading"
          summary-class="btn btn-outline"
          @export="handleExport"
        />

        <button
          class="btn btn-primary"
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
        :t="t"
        @clear="clearContent"
        @save="handleSave"
      />

      <CoverLetterPreviewCard :content-text="formData.contentText" :t="t" />
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
