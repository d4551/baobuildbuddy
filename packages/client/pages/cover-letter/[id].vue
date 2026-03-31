<script setup lang="ts">
import { COVER_LETTER_DEFAULT_TEMPLATE, isCoverLetterTemplate, type CoverLetterTemplate } from "@bao/shared/constants/cover-letter";
import { APP_ROUTES } from "@bao/shared/constants/routes";
import type { CoverLetterData } from "@bao/shared/types/cover-letter";
import { useI18n } from "vue-i18n";
import {
  coverLetterContentToPlainText,
  plainTextToCoverLetterContent,
} from "~/utils/cover-letter-content";

definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const { getCoverLetter, updateCoverLetter, generateCoverLetter, loading } = useCoverLetter();
type GenerateCoverLetterResult = Awaited<ReturnType<typeof generateCoverLetter>>;
const { $toast } = useNuxtApp();
const { t } = useI18n();
if (import.meta.server) {
  useServerSeoMeta({
    title: t("coverLetterDetailPage.details.title"),
    description: t("coverLetterPage.subtitle"),
  });
}

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

function toFileSegment(value: string, fallback: string): string {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return fallback;

  const sanitized = normalized
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");

  return sanitized.length > 0 ? sanitized : fallback;
}

function handleExport() {
  const text = formData.contentText.trim();
  if (!text) {
    $toast.error(t("coverLetterDetailPage.toasts.exportEmpty"));
    return;
  }

  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  const companySegment = toFileSegment(
    formData.company,
    t("coverLetterDetailPage.export.fallbackCompany"),
  );
  const positionSegment = toFileSegment(
    formData.position,
    t("coverLetterDetailPage.export.fallbackPosition"),
  );
  anchor.download = `${companySegment}-${positionSegment}-${t("coverLetterDetailPage.export.suffix")}.txt`;
  anchor.click();
  URL.revokeObjectURL(url);

  $toast.success(t("coverLetterDetailPage.toasts.exported"));
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <AppBreadcrumbs :crumbs="breadcrumbs" />

      <div class="flex flex-wrap gap-2">
        <button
          class="btn btn-sm btn-outline"
          :disabled="regenerating"
          :aria-label="t('coverLetterDetailPage.actions.regenerateAria')"
          @click="requestRegenerate"
        >
          <span v-if="regenerating" class="loading loading-spinner loading-xs"></span>
          <IconRefresh v-else class="h-4 w-4" />
          {{ t("coverLetterDetailPage.actions.regenerateButton") }}
        </button>

        <button
          class="btn btn-sm btn-outline"
          :aria-label="t('coverLetterDetailPage.actions.exportAria')"
          @click="handleExport"
        >
          <IconDownload class="h-4 w-4" />
          {{ t("coverLetterDetailPage.actions.exportButton") }}
        </button>

        <button
          class="btn btn-sm btn-primary"
          :disabled="!hasUnsavedChanges"
          :aria-label="t('coverLetterDetailPage.actions.saveAria')"
          @click="handleSave"
        >
          {{ t("coverLetterDetailPage.actions.saveButton") }}
        </button>
      </div>
    </div>

    <LoadingSkeleton v-if="loading" :lines="10" />

    <div v-else class="space-y-6">
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
  </div>
</template>
