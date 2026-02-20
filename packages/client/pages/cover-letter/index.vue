<script setup lang="ts">
import {
  APP_ROUTE_BUILDERS,
  APP_ROUTE_QUERY_KEYS,
  COVER_LETTER_COMPANY_MIN_LENGTH,
  COVER_LETTER_CONTENT_PREVIEW_LENGTH,
  COVER_LETTER_DEFAULT_TEMPLATE,
  COVER_LETTER_JOB_DESCRIPTION_MIN_LENGTH,
  COVER_LETTER_LIST_PAGE_SIZE,
  COVER_LETTER_POSITION_MIN_LENGTH,
  COVER_LETTER_TEMPLATE_OPTIONS,
  type CoverLetterTemplate,
  isCoverLetterTemplate,
} from "@bao/shared";
import { useI18n } from "vue-i18n";
import { settlePromise } from "~/composables/async-flow";
import { coverLetterContentToPlainText } from "~/utils/cover-letter-content";
import { getErrorMessage } from "~/utils/errors";

definePageMeta({
  middleware: ["auth"],
});

type CoverLetterSortOrder = "newest" | "oldest";

const { coverLetters, loading, fetchCoverLetters, deleteCoverLetter, generateCoverLetter } =
  useCoverLetter();
const { resumes, fetchResumes } = useResume();
const router = useRouter();
const route = useRoute();
const { $toast } = useNuxtApp();
const { t, locale } = useI18n();

const showGenerateModal = ref(false);
const generating = ref(false);
const generateDialogRef = ref<HTMLDialogElement | null>(null);
useFocusTrap(generateDialogRef, () => showGenerateModal.value);

const showDeleteCoverLetterDialog = ref(false);
const pendingDeleteCoverLetterId = ref<string | null>(null);

const searchQuery = ref("");
const templateFilter = ref<CoverLetterTemplate | "all">("all");
const sortOrder = ref<CoverLetterSortOrder>("newest");

const initialResumeId = ref("");
const generateForm = reactive<{
  company: string;
  position: string;
  jobDescription: string;
  resumeId: string;
  template: CoverLetterTemplate;
}>({
  company: "",
  position: "",
  jobDescription: "",
  resumeId: "",
  template: COVER_LETTER_DEFAULT_TEMPLATE,
});

const filteredCoverLetters = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();

  const items = coverLetters.value.filter((letter) => {
    if (templateFilter.value !== "all") {
      const activeTemplate = letter.template ?? COVER_LETTER_DEFAULT_TEMPLATE;
      if (activeTemplate !== templateFilter.value) {
        return false;
      }
    }

    if (!query) return true;

    const content = coverLetterContentToPlainText(letter.content).toLowerCase();
    return (
      letter.company.toLowerCase().includes(query) ||
      letter.position.toLowerCase().includes(query) ||
      content.includes(query)
    );
  });

  return [...items].sort((left, right) => {
    const leftDate = left.createdAt ? new Date(left.createdAt).getTime() : 0;
    const rightDate = right.createdAt ? new Date(right.createdAt).getTime() : 0;
    return sortOrder.value === "newest" ? rightDate - leftDate : leftDate - rightDate;
  });
});

function hasCoverLetterId(
  letter: (typeof coverLetters.value)[number],
): letter is (typeof coverLetters.value)[number] & { id: string } {
  return typeof letter.id === "string" && letter.id.trim().length > 0;
}

const displayCoverLetters = computed(() => filteredCoverLetters.value.filter(hasCoverLetterId));
const coverLetterPagination = usePagination(displayCoverLetters, COVER_LETTER_LIST_PAGE_SIZE, [
  searchQuery,
  templateFilter,
  sortOrder,
]);
const coverLetterPaginationSummary = computed(() =>
  t("coverLetterPage.pagination.summary", {
    start: coverLetterPagination.rangeStart.value,
    end: coverLetterPagination.rangeEnd.value,
    total: coverLetterPagination.totalItems.value,
  }),
);

const templateUsageCount = computed(() => {
  return new Set(
    coverLetters.value.map((letter) => letter.template ?? COVER_LETTER_DEFAULT_TEMPLATE),
  ).size;
});

const hasFiltersApplied = computed(
  () =>
    searchQuery.value.trim().length > 0 ||
    templateFilter.value !== "all" ||
    sortOrder.value !== "newest",
);

onMounted(async () => {
  const routeResumeId = route.query[APP_ROUTE_QUERY_KEYS.resumeId];
  if (typeof routeResumeId === "string" && routeResumeId.trim().length > 0) {
    initialResumeId.value = routeResumeId.trim();
    generateForm.resumeId = initialResumeId.value;
  }

  await Promise.all([fetchCoverLetters(), fetchResumes()]);
});

watch(showGenerateModal, (isOpen) => {
  const dialog = generateDialogRef.value;
  if (!dialog) return;

  if (isOpen && !dialog.open) {
    dialog.showModal();
  } else if (!isOpen && dialog.open) {
    dialog.close();
  }
});

function templateLabel(template: CoverLetterTemplate): string {
  if (template === "professional") return t("coverLetterPage.templates.professional");
  if (template === "creative") return t("coverLetterPage.templates.creative");
  return t("coverLetterPage.templates.gaming");
}

function formatCreatedAt(value: string | undefined): string {
  if (!value) return t("coverLetterPage.notAvailable");
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t("coverLetterPage.notAvailable");
  return new Intl.DateTimeFormat(locale.value, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function previewContent(value: string): string {
  if (value.length <= COVER_LETTER_CONTENT_PREVIEW_LENGTH) return value;
  return `${value.slice(0, COVER_LETTER_CONTENT_PREVIEW_LENGTH)}…`;
}

function getPreviewText(content: Record<string, string | undefined>): string {
  const plainText = coverLetterContentToPlainText(content);
  if (!plainText) return t("coverLetterPage.cards.emptyPreview");
  return previewContent(plainText);
}

function requestDeleteCoverLetter(id: string) {
  pendingDeleteCoverLetterId.value = id;
  showDeleteCoverLetterDialog.value = true;
}

function clearDeleteCoverLetterState() {
  pendingDeleteCoverLetterId.value = null;
}

function clearFilters() {
  searchQuery.value = "";
  templateFilter.value = "all";
  sortOrder.value = "newest";
}

function coverLetterPageAria(page: number): string {
  return t("coverLetterPage.pagination.pageAria", { page });
}

function resetGenerateForm() {
  generateForm.company = "";
  generateForm.position = "";
  generateForm.jobDescription = "";
  generateForm.resumeId = initialResumeId.value;
  generateForm.template = COVER_LETTER_DEFAULT_TEMPLATE;
}

async function handleDeleteCoverLetter() {
  const id = pendingDeleteCoverLetterId.value;
  if (!id) return;

  const deleteResult = await settlePromise(
    deleteCoverLetter(id),
    t("coverLetterPage.toasts.deleteFailed"),
  );
  clearDeleteCoverLetterState();
  showDeleteCoverLetterDialog.value = false;

  if (!deleteResult.ok) {
    $toast.error(getErrorMessage(deleteResult.error, t("coverLetterPage.toasts.deleteFailed")));
    return;
  }

  $toast.success(t("coverLetterPage.toasts.deleted"));
}

function editLetter(id: string) {
  router.push(APP_ROUTE_BUILDERS.coverLetterDetail(id));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function resolveGeneratedCoverLetterId(value: unknown): string | null {
  if (!isRecord(value)) return null;

  if (typeof value.id === "string" && value.id.trim().length > 0) {
    return value.id;
  }

  const coverLetter = value.coverLetter;
  if (!isRecord(coverLetter)) return null;
  if (typeof coverLetter.id !== "string") return null;
  return coverLetter.id.trim().length > 0 ? coverLetter.id : null;
}

async function handleGenerate() {
  if (generateForm.company.trim().length < COVER_LETTER_COMPANY_MIN_LENGTH) {
    $toast.error(
      t("coverLetterPage.toasts.companyMinLength", { count: COVER_LETTER_COMPANY_MIN_LENGTH }),
    );
    return;
  }

  if (generateForm.position.trim().length < COVER_LETTER_POSITION_MIN_LENGTH) {
    $toast.error(
      t("coverLetterPage.toasts.positionMinLength", { count: COVER_LETTER_POSITION_MIN_LENGTH }),
    );
    return;
  }

  if (
    generateForm.jobDescription.trim().length > 0 &&
    generateForm.jobDescription.trim().length < COVER_LETTER_JOB_DESCRIPTION_MIN_LENGTH
  ) {
    $toast.error(
      t("coverLetterPage.toasts.jobDescriptionMinLength", {
        count: COVER_LETTER_JOB_DESCRIPTION_MIN_LENGTH,
      }),
    );
    return;
  }

  generating.value = true;
  const generateResult = await settlePromise(
    generateCoverLetter({
      company: generateForm.company.trim(),
      position: generateForm.position.trim(),
      resumeId: generateForm.resumeId.trim().length > 0 ? generateForm.resumeId.trim() : undefined,
      template: generateForm.template,
      save: true,
      ...(generateForm.jobDescription.trim().length > 0
        ? { jobInfo: { description: generateForm.jobDescription.trim() } }
        : {}),
    }),
    t("coverLetterPage.toasts.generateFailed"),
  );
  generating.value = false;

  if (!generateResult.ok) {
    $toast.error(getErrorMessage(generateResult.error, t("coverLetterPage.toasts.generateFailed")));
    return;
  }

  showGenerateModal.value = false;
  resetGenerateForm();

  const generatedId = resolveGeneratedCoverLetterId(generateResult.value);
  if (generatedId) {
    $toast.success(t("coverLetterPage.toasts.generated"));
    router.push(APP_ROUTE_BUILDERS.coverLetterDetail(generatedId));
    return;
  }

  $toast.success(t("coverLetterPage.toasts.generatedWithoutRedirect"));
}

const templateFilterOptions = computed(() => {
  return [
    {
      value: "all",
      label: t("coverLetterPage.filters.templateAll"),
    },
    ...COVER_LETTER_TEMPLATE_OPTIONS.map((template) => ({
      value: template,
      label: templateLabel(template),
    })),
  ];
});

const sortOptions = computed<
  {
    value: CoverLetterSortOrder;
    label: string;
  }[]
>(() => [
  {
    value: "newest",
    label: t("coverLetterPage.filters.sortNewest"),
  },
  {
    value: "oldest",
    label: t("coverLetterPage.filters.sortOldest"),
  },
]);

function resolveTemplate(value: string): CoverLetterTemplate {
  return isCoverLetterTemplate(value) ? value : COVER_LETTER_DEFAULT_TEMPLATE;
}
</script>

<template>
  <div class="mx-auto w-full max-w-7xl space-y-6">
    <section class="rounded-box border border-base-300 bg-base-200 p-6">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="space-y-2">
          <h1 class="text-3xl font-bold">{{ t("coverLetterPage.title") }}</h1>
          <p class="max-w-2xl text-sm text-base-content/70">{{ t("coverLetterPage.subtitle") }}</p>
        </div>

        <button
          class="btn btn-primary"
          :aria-label="t('coverLetterPage.generateButtonAria')"
          @click="showGenerateModal = true"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {{ t("coverLetterPage.generateButton") }}
        </button>
      </div>

      <div class="stats stats-vertical mt-4 w-full border border-base-300 bg-base-100 shadow-sm sm:stats-horizontal">
        <div class="stat">
          <div class="stat-title">{{ t("coverLetterPage.stats.totalTitle") }}</div>
          <div class="stat-value text-primary">{{ coverLetters.length }}</div>
          <div class="stat-desc">{{ t("coverLetterPage.stats.totalDesc") }}</div>
        </div>
        <div class="stat">
          <div class="stat-title">{{ t("coverLetterPage.stats.filteredTitle") }}</div>
          <div class="stat-value text-secondary">{{ filteredCoverLetters.length }}</div>
          <div class="stat-desc">{{ t("coverLetterPage.stats.filteredDesc") }}</div>
        </div>
        <div class="stat">
          <div class="stat-title">{{ t("coverLetterPage.stats.templatesTitle") }}</div>
          <div class="stat-value">{{ templateUsageCount }}</div>
          <div class="stat-desc">{{ t("coverLetterPage.stats.templatesDesc") }}</div>
        </div>
      </div>
    </section>

    <section class="card card-border bg-base-100">
      <div class="card-body">
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <fieldset class="fieldset lg:col-span-2">
            <legend class="fieldset-legend">{{ t("coverLetterPage.filters.searchLegend") }}</legend>
            <input
              v-model="searchQuery"
              type="search"
              class="input w-full"
              :placeholder="t('coverLetterPage.filters.searchPlaceholder')"
              :aria-label="t('coverLetterPage.filters.searchAria')"
            />
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("coverLetterPage.filters.templateLegend") }}</legend>
            <select
              v-model="templateFilter"
              class="select w-full"
              :aria-label="t('coverLetterPage.filters.templateAria')"
            >
              <option
                v-for="option in templateFilterOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("coverLetterPage.filters.sortLegend") }}</legend>
            <select
              v-model="sortOrder"
              class="select w-full"
              :aria-label="t('coverLetterPage.filters.sortAria')"
            >
              <option
                v-for="option in sortOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </fieldset>
        </div>

        <div class="card-actions justify-end" v-if="hasFiltersApplied">
          <button class="btn btn-sm btn-ghost" :aria-label="t('coverLetterPage.filters.clearAria')" @click="clearFilters">
            {{ t("coverLetterPage.filters.clearButton") }}
          </button>
        </div>
      </div>
    </section>

    <LoadingSkeleton v-if="loading && coverLetters.length === 0" variant="cards" :lines="6" />

    <EmptyState
      v-else-if="coverLetters.length === 0"
      title-key="coverLetterPage.emptyStateTitle"
      description-key="coverLetterPage.emptyStateDescription"
    />

    <div v-else-if="displayCoverLetters.length === 0" class="alert alert-soft" role="status">
      <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 14l2-2m0 0l2-2m-2 2l2 2m-2-2l-2 2m9 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{{ t("coverLetterPage.filteredEmptyState") }}</span>
    </div>

    <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <article
        v-for="letter in coverLetterPagination.items.value"
        :key="letter.id"
        class="card card-border cursor-pointer bg-base-100 transition-colors hover:bg-base-200"
        role="button"
        tabindex="0"
        :aria-label="t('coverLetterPage.cards.openAria', { company: letter.company, position: letter.position })"
        @click="editLetter(letter.id)"
        @keydown.enter="editLetter(letter.id)"
        @keydown.space.prevent="editLetter(letter.id)"
      >
        <div class="card-body">
          <div class="flex items-start justify-between gap-2">
            <div>
              <h2 class="card-title text-lg">{{ letter.position }}</h2>
              <p class="text-sm text-base-content/70">{{ letter.company }}</p>
            </div>
            <span class="badge badge-outline badge-sm">
              {{ templateLabel(resolveTemplate(letter.template || COVER_LETTER_DEFAULT_TEMPLATE)) }}
            </span>
          </div>

          <p class="line-clamp-4 text-sm text-base-content/80">
            {{ getPreviewText(letter.content) }}
          </p>

          <div class="flex items-center justify-between text-xs text-base-content/60">
            <span>{{ t("coverLetterPage.cards.updatedAtLabel") }}</span>
            <time>{{ formatCreatedAt(letter.updatedAt || letter.createdAt) }}</time>
          </div>

          <div class="card-actions justify-end">
            <button
              class="btn btn-sm btn-outline"
              :aria-label="t('coverLetterPage.cards.editAria', { company: letter.company, position: letter.position })"
              @click.stop="editLetter(letter.id)"
            >
              {{ t("coverLetterPage.cards.editButton") }}
            </button>
            <button
              class="btn btn-sm btn-error btn-outline"
              :aria-label="t('coverLetterPage.cards.deleteAria', { company: letter.company, position: letter.position })"
              @click.stop="requestDeleteCoverLetter(letter.id)"
            >
              {{ t("coverLetterPage.cards.deleteButton") }}
            </button>
          </div>
        </div>
      </article>
    </div>

    <AppPagination
      :current-page="coverLetterPagination.currentPage.value"
      :total-pages="coverLetterPagination.totalPages.value"
      :page-numbers="coverLetterPagination.pageNumbers.value"
      :summary="coverLetterPaginationSummary"
      :navigation-aria="t('coverLetterPage.pagination.navigationAria')"
      :previous-aria="t('coverLetterPage.pagination.previousAria')"
      :next-aria="t('coverLetterPage.pagination.nextAria')"
      :page-aria="coverLetterPageAria"
      @update:current-page="coverLetterPagination.goToPage"
    />

    <dialog ref="generateDialogRef" class="modal modal-bottom sm:modal-middle" @close="showGenerateModal = false">
      <div class="modal-box max-w-2xl">
        <h2 class="text-lg font-bold">{{ t("coverLetterPage.generate.title") }}</h2>
        <p class="mt-1 text-sm text-base-content/70">{{ t("coverLetterPage.generate.subtitle") }}</p>

        <div class="mt-4 space-y-4">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("coverLetterPage.generate.companyLegend") }}</legend>
            <input
              v-model="generateForm.company"
              type="text"
              :minlength="COVER_LETTER_COMPANY_MIN_LENGTH"
              required
              class="input validator w-full"
              :placeholder="t('coverLetterPage.generate.companyPlaceholder')"
              :aria-label="t('coverLetterPage.generate.companyAria')"
            />
            <p class="validator-hint">
              {{ t("coverLetterPage.generate.companyHint", { count: COVER_LETTER_COMPANY_MIN_LENGTH }) }}
            </p>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("coverLetterPage.generate.positionLegend") }}</legend>
            <input
              v-model="generateForm.position"
              type="text"
              :minlength="COVER_LETTER_POSITION_MIN_LENGTH"
              required
              class="input validator w-full"
              :placeholder="t('coverLetterPage.generate.positionPlaceholder')"
              :aria-label="t('coverLetterPage.generate.positionAria')"
            />
            <p class="validator-hint">
              {{ t("coverLetterPage.generate.positionHint", { count: COVER_LETTER_POSITION_MIN_LENGTH }) }}
            </p>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("coverLetterPage.generate.resumeLegend") }}</legend>
            <select
              v-model="generateForm.resumeId"
              class="select w-full"
              :aria-label="t('coverLetterPage.generate.resumeAria')"
            >
              <option value="">{{ t("coverLetterPage.generate.resumeNoneOption") }}</option>
              <option v-for="resume in resumes" :key="resume.id" :value="resume.id">
                {{ resume.name }}
              </option>
            </select>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("coverLetterPage.generate.jobDescriptionLegend") }}</legend>
            <textarea
              v-model="generateForm.jobDescription"
              :minlength="COVER_LETTER_JOB_DESCRIPTION_MIN_LENGTH"
              class="textarea validator w-full"
              rows="5"
              :placeholder="t('coverLetterPage.generate.jobDescriptionPlaceholder')"
              :aria-label="t('coverLetterPage.generate.jobDescriptionAria')"
            ></textarea>
            <p class="validator-hint">
              {{ t("coverLetterPage.generate.jobDescriptionHint", { count: COVER_LETTER_JOB_DESCRIPTION_MIN_LENGTH }) }}
            </p>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("coverLetterPage.generate.templateLegend") }}</legend>
            <select
              v-model="generateForm.template"
              class="select w-full"
              :aria-label="t('coverLetterPage.generate.templateAria')"
            >
              <option
                v-for="template in COVER_LETTER_TEMPLATE_OPTIONS"
                :key="template"
                :value="template"
              >
                {{ templateLabel(template) }}
              </option>
            </select>
          </fieldset>
        </div>

        <div class="modal-action">
          <button class="btn btn-ghost" :aria-label="t('coverLetterPage.generate.cancelAria')" @click="showGenerateModal = false">
            {{ t("coverLetterPage.generate.cancelButton") }}
          </button>
          <button
            class="btn btn-primary"
            :disabled="generating || !generateForm.company || !generateForm.position"
            :aria-label="t('coverLetterPage.generate.submitAria')"
            @click="handleGenerate"
          >
            <span v-if="generating" class="loading loading-spinner loading-xs"></span>
            <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {{ t("coverLetterPage.generate.submitButton") }}
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button :aria-label="t('coverLetterPage.generate.closeBackdropAria')" @click="showGenerateModal = false">
          {{ t("coverLetterPage.generate.closeBackdropButton") }}
        </button>
      </form>
    </dialog>

    <ConfirmDialog
      id="cover-letter-delete-dialog"
      v-model:open="showDeleteCoverLetterDialog"
      :title="t('coverLetterPage.deleteDialog.title')"
      :message="t('coverLetterPage.deleteDialog.message')"
      :confirm-text="t('coverLetterPage.deleteDialog.confirmButton')"
      :cancel-text="t('coverLetterPage.deleteDialog.cancelButton')"
      variant="danger"
      focus-primary
      @confirm="handleDeleteCoverLetter"
      @cancel="clearDeleteCoverLetterState"
    />
  </div>
</template>
