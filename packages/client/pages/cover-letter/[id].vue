<script setup lang="ts">
import {
  APP_ROUTES,
  COVER_LETTER_COMPANY_MIN_LENGTH,
  COVER_LETTER_DEFAULT_TEMPLATE,
  COVER_LETTER_POSITION_MIN_LENGTH,
  COVER_LETTER_TEMPLATE_OPTIONS,
  type CoverLetterData,
  type CoverLetterTemplate,
  isCoverLetterTemplate,
} from "@bao/shared";
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
      <div class="stats stats-vertical w-full border border-base-300 bg-base-100 shadow-sm lg:stats-horizontal">
        <div class="stat">
          <div class="stat-title">{{ t("coverLetterDetailPage.stats.charactersTitle") }}</div>
          <div class="stat-value text-primary">{{ contentCharacterCount }}</div>
          <div class="stat-desc">{{ t("coverLetterDetailPage.stats.charactersDesc") }}</div>
        </div>
        <div class="stat">
          <div class="stat-title">{{ t("coverLetterDetailPage.stats.sectionsTitle") }}</div>
          <div class="stat-value">{{ contentSectionCount }}</div>
          <div class="stat-desc">{{ t("coverLetterDetailPage.stats.sectionsDesc") }}</div>
        </div>
        <div class="stat">
          <div class="stat-title">{{ t("coverLetterDetailPage.stats.statusTitle") }}</div>
          <div class="stat-value text-secondary">
            {{ hasUnsavedChanges ? t("coverLetterDetailPage.stats.statusUnsaved") : t("coverLetterDetailPage.stats.statusSaved") }}
          </div>
          <div class="stat-desc">{{ t("coverLetterDetailPage.stats.statusDesc") }}</div>
        </div>
      </div>

      <section class="card bg-base-200">
        <div class="card-body">
          <h2 class="card-title">{{ t("coverLetterDetailPage.details.title") }}</h2>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t("coverLetterDetailPage.details.companyLegend") }}</legend>
              <input
                v-model="formData.company"
                type="text"
                :minlength="COVER_LETTER_COMPANY_MIN_LENGTH"
                class="input validator w-full"
                :placeholder="t('coverLetterDetailPage.details.companyPlaceholder')"
                :aria-label="t('coverLetterDetailPage.details.companyAria')"
              />
              <p class="validator-hint">
                {{ t("coverLetterDetailPage.details.companyHint", { count: COVER_LETTER_COMPANY_MIN_LENGTH }) }}
              </p>
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t("coverLetterDetailPage.details.positionLegend") }}</legend>
              <input
                v-model="formData.position"
                type="text"
                :minlength="COVER_LETTER_POSITION_MIN_LENGTH"
                class="input validator w-full"
                :placeholder="t('coverLetterDetailPage.details.positionPlaceholder')"
                :aria-label="t('coverLetterDetailPage.details.positionAria')"
              />
              <p class="validator-hint">
                {{ t("coverLetterDetailPage.details.positionHint", { count: COVER_LETTER_POSITION_MIN_LENGTH }) }}
              </p>
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t("coverLetterDetailPage.details.templateLegend") }}</legend>
              <select
                v-model="formData.template"
                class="select w-full"
                :aria-label="t('coverLetterDetailPage.details.templateAria')"
              >
                <option v-for="template in COVER_LETTER_TEMPLATE_OPTIONS" :key="template" :value="template">
                  {{ templateLabel(template) }}
                </option>
              </select>
            </fieldset>
          </div>
        </div>
      </section>

      <section class="card bg-base-200">
        <div class="card-body">
          <h2 class="card-title">{{ t("coverLetterDetailPage.editor.title") }}</h2>

          <div class="alert alert-info alert-soft" role="status">
            <IconInfoCircle class="h-5 w-5" />
            <span>{{ t("coverLetterDetailPage.editor.info") }}</span>
          </div>

          <textarea
            v-model="formData.contentText"
            class="textarea w-full font-mono text-sm"
            rows="20"
            :placeholder="t('coverLetterDetailPage.editor.placeholder')"
            :aria-label="t('coverLetterDetailPage.editor.aria')"
          ></textarea>

          <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
            <span class="text-sm text-base-content/60">
              {{ t("coverLetterDetailPage.editor.characterCount", { count: contentCharacterCount }) }}
            </span>
            <div class="flex gap-2">
              <button class="btn btn-sm btn-ghost" :aria-label="t('coverLetterDetailPage.editor.clearAria')" @click="clearContent">
                {{ t("coverLetterDetailPage.editor.clearButton") }}
              </button>
              <button class="btn btn-sm btn-primary" :aria-label="t('coverLetterDetailPage.editor.saveAria')" @click="handleSave">
                {{ t("coverLetterDetailPage.editor.saveButton") }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section class="card bg-base-200">
        <div class="card-body">
          <h2 class="card-title">{{ t("coverLetterDetailPage.preview.title") }}</h2>
          <div class="rounded-lg border border-base-300 bg-base-100 p-6 shadow-inner">
            <div v-if="formData.contentText.trim().length > 0" class="whitespace-pre-wrap text-sm leading-relaxed">
              {{ formData.contentText }}
            </div>
            <p v-else class="text-sm text-base-content/60">{{ t("coverLetterDetailPage.preview.empty") }}</p>
          </div>
        </div>
      </section>
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
